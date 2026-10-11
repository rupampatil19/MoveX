/**
 * usePoseEngine — TensorFlow MoveNet pose engine + session driver.
 * Ported from AR Fit (TS to JS).
 *
 * Phases:
 *   boot      -> loading model + camera
 *   framing   -> waiting for full body to be visible
 *   countdown -> 3-2-1
 *   live      -> counting reps
 *   done      -> set finished, summary ready
 *   error     -> model/camera failed
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import { SKELETON_PAIRS } from '../lib/ar/exercises.js';
import { toKPMap, visible } from '../lib/ar/geometry.js';
import { DEPTH_CUE, FLAG_CUES, LIVE_CUE_PRIORITY } from '../lib/ar/formRules.js';
import { saveSession, scoreRep, summarize } from '../lib/ar/history.js';
import { RepCounter } from '../lib/ar/repCounter.js';

const HOLD_FRAME_MS = 1000;
const COUNTDOWN_S = 3;

function say(text) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.volume = 1;
    s.speak(u);
  } catch {
    // speech not available
  }
}

export function usePoseEngine(videoRef, canvasRef, opts) {
  const [phase, setPhase] = useState('boot');
  const [error, setError] = useState(null);

  const detectorRef = useRef(null);
  const rafRef = useRef(0);
  const counterRef = useRef(new RepCounter(opts.exercise.repCfg));
  const analyzerRef = useRef(opts.exercise.makeAnalyzer());
  const startTimeRef = useRef(0);
  const hipTrailRef = useRef([]);
  const lastRepAtRef = useRef(0);
  const hudThrottleRef = useRef(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const phaseRef = useRef('boot');
  const streamRef = useRef(null);
  const framingSinceRef = useRef(null);
  const countdownStartRef = useRef(0);
  const lastCountRef = useRef(0);
  const adjHistRef = useRef([]);
  const repLogRef = useRef([]);
  const partialsRef = useRef(0);
  const frameSumRef = useRef({ sum: 0, n: 0 });
  const lastCoachRef = useRef(0);
  const cueIdRef = useRef(0);
  const lastSpokenRef = useRef({});
  const fpsRef = useRef({ n: 0, t0: performance.now(), v: 0 });
  const modelOkRef = useRef(false);
  const camOkRef = useRef(false);
  const maybeReadyRef = useRef(() => {});

  const setPhaseBoth = useCallback((p) => {
    phaseRef.current = p;
    setPhase(p);
    optsRef.current.onHud({ phase: p });
  }, []);

  const speak = useCallback((text, key, minGapMs = 0) => {
    if (!optsRef.current.voice) return false;
    const now = performance.now();
    const last = lastSpokenRef.current[key];
    if (now - (last === undefined ? -1e9 : last) < minGapMs) return false;
    lastSpokenRef.current[key] = now;
    say(text);
    return true;
  }, []);

  /** Spoken correction: at most one every 8 s, same one at most every 20 s. */
  const coach = useCallback(
    (text) => {
      const now = performance.now();
      if (now - lastCoachRef.current < 8000) return false;
      if (!speak(text, 'coach:' + text, 20000)) return false;
      lastCoachRef.current = now;
      return true;
    },
    [speak]
  );

  /** Close the set: score it, save on device, show the result. */
  const finishSet = useCallback(() => {
    const log = repLogRef.current;
    if (!log.length) return null;
    const ex = optsRef.current.exercise;
    const sum = summarize({
      exerciseId: ex.id,
      exercise: ex.name,
      target: ex.targetReps,
      log,
      partials: partialsRef.current,
      durationSec: Math.max(0, Math.floor((performance.now() - startTimeRef.current) / 1000)),
    });
    saveSession(sum);
    setPhaseBoth('done');
    optsRef.current.onHud({ summary: sum, adjustments: [] });
    speak(`Set complete. Accuracy ${sum.accuracy} percent. ${sum.remark}`, 'done');
    return sum;
  }, [setPhaseBoth, speak]);

  const flash = useCallback((text, tone) => {
    optsRef.current.onHud({ cue: { id: ++cueIdRef.current, text, tone } });
  }, []);

  /* ---------- 1. load model + render loop (once) ---------- */
  useEffect(() => {
    let cancelled = false;

    const mirrored = () => optsRef.current.facing === 'user';

    function mapPoint(x, y, cw, ch, vw, vh) {
      // Some pose models return keypoints in 0..1 normalized space; others return pixels.
      // Auto-detect: if all coordinates are <= 1.5, treat as normalized and scale up.
      // (The mapPoint is called per-keypoint, so we detect per-point.)
      let nx = x;
      let ny = y;
      // Heuristic: if x or y is in 0..1 range, assume normalized output.
      if (Math.abs(x) <= 1.5 && Math.abs(y) <= 1.5) {
        nx = x * vw;
        ny = y * vh;
      }
      const scale = Math.max(cw / vw, ch / vh);
      const ox = (cw - vw * scale) / 2;
      const oy = (ch - vh * scale) / 2;
      let px = nx * scale + ox;
      if (mirrored()) px = cw - px;
      return { x: px, y: ny * scale + oy };
    }

    function drawSkeleton(ctx, kps, cw, ch, vw, vh, perfect) {
      const color = perfect ? 'rgba(255,255,255,0.98)' : 'rgba(245,165,36,0.98)';
      const unit = Math.max(1, Math.min(cw, ch) / 400);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 5 * unit;
      ctx.strokeStyle = color;
      for (const pair of SKELETON_PAIRS) {
        const pa = kps[pair[0]], pb = kps[pair[1]];
        if (!visible(pa) || !visible(pb)) continue;
        const A = mapPoint(pa.x, pa.y, cw, ch, vw, vh);
        const B = mapPoint(pb.x, pb.y, cw, ch, vw, vh);
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
      }
      for (const key of Object.keys(kps)) {
        const p = kps[key];
        if (!visible(p)) continue;
        const P = mapPoint(p.x, p.y, cw, ch, vw, vh);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(P.x, P.y, 10 * unit, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(P.x, P.y, 7 * unit, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawAngleTags(ctx, analysis, cw, ch, vw, vh) {
      const unit = Math.max(1, Math.min(cw, ch) / 400);
      const fs = Math.round(20 * unit);
      ctx.save();
      ctx.font = `600 ${fs}px system-ui, sans-serif`;
      for (const ang of analysis.angles) {
        const P = mapPoint(ang.at.x, ang.at.y, cw, ch, vw, vh);
        const label = `${ang.name} ${Math.round(ang.deg)}\u00B0`;
        const w = ctx.measureText(label).width + 22 * unit;
        const h = fs + 16 * unit;
        const bx = Math.min(cw - w - 8, Math.max(8, P.x + 26 * unit));
        const by = Math.min(ch - h - 8, Math.max(8, P.y - h - 20 * unit));
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2 * unit;
        ctx.beginPath();
        ctx.moveTo(P.x, P.y);
        ctx.lineTo(bx + 6, by + h / 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(bx, by, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2 * unit;
        ctx.strokeRect(bx, by, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, bx + 14 * unit, by + h - 12 * unit);
      }
      ctx.restore();
    }

    async function loop() {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const detector = detectorRef.current;
      if (!video || !canvas || !detector || video.readyState < 2 || !camOkRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
      }
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      const t = performance.now();

      const f = fpsRef.current;
      f.n++;
      if (t - f.t0 > 1000) {
        f.v = Math.round((f.n * 1000) / (t - f.t0));
        f.n = 0;
        f.t0 = t;
      }

      let analysis = null;
      try {
        const poses = await detector.estimatePoses(video, { flipHorizontal: false });
        // Note: we mirror in mapPoint() for the "user" (front) camera, so keep flipHorizontal false here.
        const pose = poses[0];
        const cur = phaseRef.current;
        if (pose && pose.keypoints) {
          const kps = toKPMap(pose.keypoints);
          analysis = analyzerRef.current.analyze(kps, t);
          const vw = video.videoWidth, vh = video.videoHeight;

          if (cur === 'framing') {
            if (analysis.visibleBody && analysis.repAngle !== null) {
              if (framingSinceRef.current === null) framingSinceRef.current = t;
              if (t - framingSinceRef.current >= HOLD_FRAME_MS) {
                countdownStartRef.current = t;
                lastCountRef.current = COUNTDOWN_S + 1;
                setPhaseBoth('countdown');
              }
            } else {
              framingSinceRef.current = null;
            }
          }

          if (cur === 'live') {
            const step = counterRef.current.update(
              analysis.visibleBody ? analysis.repAngle : null,
              t,
              { secondaryDown: analysis.visibleBody ? analysis.aux.secondaryDown : null }
            );
            optsRef.current.onHud({ reps: step.reps, repPhase: step.phase });

            if (analysis.visibleBody && (step.phase === 'transition' || step.phase === 'down')) {
              frameSumRef.current.sum += analysis.alignment;
              frameSumRef.current.n++;
            }

            if (step.event === 'rep') {
              const gap = t - lastRepAtRef.current;
              lastRepAtRef.current = t;
              const ex = optsRef.current.exercise;
              const depth = step.lastMinAngle !== null ? Math.round(step.lastMinAngle) : null;
              optsRef.current.onHud({ repSpeedOk: gap > 1200 || gap === t, lastDepth: depth });

              const repFlags = [...analyzerRef.current.lastRepFlags];
              const shallow = step.secondaryOk === false;
              const fs = frameSumRef.current;
              const avg = fs.n ? fs.sum / fs.n : 85;
              frameSumRef.current = { sum: 0, n: 0 };
              repLogRef.current.push({ score: scoreRep(avg, repFlags, shallow), depth, flags: repFlags, shallow });

              if (step.reps >= optsRef.current.exercise.targetReps) {
                flash(`${step.reps} \u00B7 Set done`, 'good');
                finishSet();
              } else {
                const top = (LIVE_CUE_PRIORITY[ex.id] || []).find((fl) => repFlags.includes(fl));
                const cue = top ? FLAG_CUES[top].text : shallow ? DEPTH_CUE[ex.id] : null;
                if (cue) {
                  flash(`${step.reps} \u00B7 ${cue}`, 'warn');
                  if (!coach(cue)) speak(String(step.reps), 'rep');
                } else {
                  flash(String(step.reps), 'good');
                  speak(String(step.reps), 'rep');
                }
              }
            } else if (step.event === 'partial') {
              partialsRef.current++;
              const msg = DEPTH_CUE[optsRef.current.exercise.id] || 'Go deeper';
              flash(msg, 'warn');
              coach(msg);
            }

            const hip = kps['left_hip'] || kps['right_hip'];
            if (hip && visible(hip)) {
              hipTrailRef.current.push(hip.x, hip.y);
              if (hipTrailRef.current.length > 60)
                hipTrailRef.current.splice(0, hipTrailRef.current.length - 60);
              const xs = hipTrailRef.current.filter((_, i) => i % 2 === 0);
              const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
              const varx = xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / xs.length;
              optsRef.current.onHud({
                stability: Math.max(0, Math.min(1, 1 - Math.sqrt(varx) / 40)),
              });
            }
          }

          if (cur === 'live' || cur === 'framing' || cur === 'countdown') {
            drawSkeleton(ctx, kps, cw, ch, vw, vh, analysis.perfect);
            if (cur === 'live') drawAngleTags(ctx, analysis, cw, ch, vw, vh);
          }
        } else if (cur === 'live') {
          counterRef.current.update(null, t);
          framingSinceRef.current = null;
        } else {
          framingSinceRef.current = null;
        }
      } catch {
        // keep looping on estimation hiccup
      }

      if (phaseRef.current === 'countdown') {
        const left = COUNTDOWN_S - Math.floor((t - countdownStartRef.current) / 1000);
        if (left !== lastCountRef.current && left > 0) {
          lastCountRef.current = left;
          optsRef.current.onHud({ countdown: left });
          speak(String(left), 'count');
        }
        if (left <= 0) {
          counterRef.current.reset();
          analyzerRef.current.reset();
          hipTrailRef.current = [];
          adjHistRef.current = [];
          repLogRef.current = [];
          partialsRef.current = 0;
          frameSumRef.current = { sum: 0, n: 0 };
          startTimeRef.current = t;
          lastRepAtRef.current = 0;
          optsRef.current.onHud({ reps: 0, repPhase: 'waiting', lastDepth: null, adjustments: [] });
          setPhaseBoth('live');
          flash('GO!', 'info');
          speak('Go!', 'go');
        }
      }

      if (t - hudThrottleRef.current > 120) {
        hudThrottleRef.current = t;
        optsRef.current.onHud({
          analysis,
          fps: fpsRef.current.v,
          elapsedSec:
            phaseRef.current === 'live' ? Math.floor((t - startTimeRef.current) / 1000) : 0,
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    async function loadModel() {
      try {
        // Try WebGL first (fast), fall back to CPU (slow but universal).
        let backendSet = false;
        try {
          await tf.setBackend('webgl');
          await tf.ready();
          backendSet = true;
          console.log('[tf] backend: webgl');
        } catch (webglErr) {
          console.warn('[tf] webgl failed, falling back to cpu:', webglErr.message);
        }
        if (!backendSet) {
          try {
            await tf.setBackend('cpu');
            await tf.ready();
            console.log('[tf] backend: cpu');
          } catch (cpuErr) {
            console.error('[tf] cpu backend also failed:', cpuErr.message);
            setError('TensorFlow could not start on this device. Try a different browser.');
            setPhaseBoth('error');
            return;
          }
        }
        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          modelUrl: '/models/movenet-singlepose-lightning/model.json',
          enableSmoothing: true,
        });
        if (cancelled) return;
        detectorRef.current = detector;
        modelOkRef.current = true;
        maybeReady();
      } catch (e) {
        console.error(e);
        setError('Could not load the pose model. Check your internet connection and reload.');
        setPhaseBoth('error');
      }
    }

    function maybeReady() {
      if (modelOkRef.current && camOkRef.current && phaseRef.current === 'boot') {
        framingSinceRef.current = null;
        setPhaseBoth('framing');
      }
    }
    maybeReadyRef.current = maybeReady;

    loadModel();
    loop();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (detectorRef.current) detectorRef.current.dispose();
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 2. camera (re-runs on front/back flip) ---------- */
  useEffect(() => {
    let cancelled = false;
    camOkRef.current = false;
    optsRef.current.onHud({ cameraReady: false });
    if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());

    async function tryConstraints(constraints, label) {
      try {
        console.log('[camera] trying:', label, JSON.stringify(constraints));
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[camera] SUCCESS via', label);
        return stream;
      } catch (err) {
        console.warn('[camera] FAILED via', label, '-', err.name, '-', err.message);
        throw err;
      }
    }

    async function start() {
      let stream = null;
      let lastErr = null;

      // Attempt 1: preferred facing mode (loose)
      try {
        stream = await tryConstraints({
          video: { facingMode: { ideal: opts.facing } },
          audio: false,
        }, 'attempt-1');
      } catch (e) { lastErr = e; }

      // Attempt 2: exact facing mode
      if (!stream) {
        try {
          stream = await tryConstraints({
            video: { facingMode: { exact: opts.facing } },
            audio: false,
          }, 'attempt-2');
        } catch (e) { lastErr = e; }
      }

      // Attempt 3: pick device by label from enumerateDevices
      if (!stream) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cams = devices.filter((d) => d.kind === 'videoinput');
          console.log('[camera] available devices:', cams.map((c) => ({ id: c.deviceId.slice(0, 12), label: c.label })));
          const wanted = opts.facing === 'user'
            ? cams.find((c) => /front|user|face/i.test(c.label))
            : cams.find((c) => /back|rear|environment/i.test(c.label));
          const pick = wanted || cams[0];
          if (pick) {
            stream = await tryConstraints({
              video: { deviceId: { exact: pick.deviceId } },
              audio: false,
            }, 'attempt-3');
          }
        } catch (e) { lastErr = e; }
      }

      // Attempt 4: minimal — any camera
      if (!stream) {
        try {
          stream = await tryConstraints({ video: true, audio: false }, 'attempt-4');
        } catch (e) { lastErr = e; }
      }

      // All failed — show real error
      if (!stream) {
        const errName = (lastErr && lastErr.name) || 'UnknownError';
        const errMsg  = (lastErr && lastErr.message) || 'No details';
        console.error('[camera] all attempts failed:', errName, errMsg);
        let friendly = 'Camera failed: ' + errName + '. ';
        if (errName === 'NotAllowedError') {
          friendly += 'Permission was denied OR another app is using the camera. Close WhatsApp / Instagram / Camera and try again.';
        } else if (errName === 'NotFoundError') {
          friendly += 'No camera found on this device.';
        } else if (errName === 'NotReadableError') {
          friendly += 'Camera is busy. Close other apps and reload.';
        } else if (errName === 'OverconstrainedError') {
          friendly += 'Camera does not support the requested settings.';
        } else {
          friendly += errMsg;
        }
        setError(friendly);
        setPhaseBoth('error');
        return;
      }

      // Success
      if (cancelled) {
        stream.getTracks().forEach((tr) => tr.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch (playErr) {
        console.warn('[camera] video.play() failed:', playErr.name);
      }

      const newCounter = new RepCounter(optsRef.current.exercise.repCfg);
      newCounter.reps = counterRef.current.reps;
      counterRef.current = newCounter;
      analyzerRef.current.reset();
      hipTrailRef.current = [];
      adjHistRef.current = [];
      framingSinceRef.current = null;
      camOkRef.current = true;
      optsRef.current.onHud({ cameraReady: true });
      if (phaseRef.current === 'live') {
        framingSinceRef.current = null;
      }
      maybeReadyRef.current();
    }
    start();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.facing]);

  useEffect(
    () => () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    },
    []
  );

  const clearSetData = () => {
    repLogRef.current = [];
    partialsRef.current = 0;
    frameSumRef.current = { sum: 0, n: 0 };
  };

  /** After a finished set: new countdown, fresh counters. */
  const nextSet = useCallback(() => {
    counterRef.current.reset();
    analyzerRef.current.reset();
    hipTrailRef.current = [];
    clearSetData();
    countdownStartRef.current = performance.now();
    lastCountRef.current = COUNTDOWN_S + 1;
    optsRef.current.onHud({ summary: null, reps: 0, repPhase: 'waiting', lastDepth: null, adjustments: [] });
    setPhaseBoth('countdown');
  }, [setPhaseBoth]);

  const resetReps = useCallback(() => {
    counterRef.current.reset();
    analyzerRef.current.reset();
    clearSetData();
    hipTrailRef.current = [];
    startTimeRef.current = performance.now();
    optsRef.current.onHud({ reps: 0, repPhase: 'waiting', lastDepth: null });
  }, []);

  return { phase, error, resetReps, finishSet, nextSet };
}