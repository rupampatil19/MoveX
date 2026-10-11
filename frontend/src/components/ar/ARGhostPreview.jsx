/**
 * ARGhostPreview.jsx
 * ============================================================
 * 3D trainer preview + WebXR floor scan + camera fallback.
 * Ported from ARFit v6 src/sections/Preview.tsx (TypeScript -> JavaScript).
 *
 * Flow:
 *   loading  -> model loads
 *   needtap  -> ask for tap so WebXR can be started from user gesture
 *   scanning -> user scans floor (WebXR plane hit OR gyro fallback)
 *   placed   -> trainer is on the floor, "Start workout" available
 *   error    -> model/scan failed, retry or exit
 * ============================================================
 */
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { XREstimatedLight } from "three/examples/jsm/webxr/XREstimatedLight.js";
import { loadGhost, makeReticle, makeStage } from "../../lib/ar/ghost";
import { createGyroCamera, floorHit, requestMotionPermission } from "../../lib/ar/gyro";
import { TRAINER_SCALES, fitDistance, fitsDetectedPlane, footprintPoints } from "../../lib/ar/space";
import { ArrowLeft, RotateCw, Loader2 } from "lucide-react";

const SIDE_ON = Math.PI / 2;
const CAM_HEIGHT = 1.3; // assumed phone height in camera mode (m)
const FLOOR_MIN_UP = 0.86; // accept slightly noisy ARCore floor normals while still rejecting walls
const FLOOR_BELOW_CAM = [0.5, 2.6]; // floor must be this far under the phone (m)

export default function ARGhostPreview({ exercise, onStart, onBack }) {
  const overlayRef = useRef(null);
  const canvasHostRef = useRef(null);
  const videoRef = useRef(null);

  const [stage, setStage] = useState("loading");
  const [mode, setMode] = useState("none");
  const [status, setStatusState] = useState("scan");
  const [canForce, setCanForce] = useState(false);
  const [note, setNote] = useState(null);
  const [scalePct, setScalePct] = useState(100);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const stageRef = useRef("loading");
  const modeRef = useRef("none");
  const statusRef = useRef("scan");
  const ghostPromise = useRef(null);
  const extraYawRef = useRef(0);
  const placedYawRef = useRef(0);
  const cleanupRef = useRef(null);
  const afterEndRef = useRef(null);
  const rotateRef = useRef(null);
  const forceRef = useRef(false);
  const startedRef = useRef(false);

  const go = useCallback((s) => {
    stageRef.current = s;
    setStage(s);
  }, []);

  const setModeBoth = useCallback((m) => {
    modeRef.current = m;
    setMode(m);
  }, []);

  const setStatus = useCallback((s) => {
    if (statusRef.current === s) return;
    statusRef.current = s;
    setStatusState(s);
  }, []);

  /* load the Mixamo model */
  useEffect(() => {
    let alive = true;
    const modelUrl = new URL(`${import.meta.env.BASE_URL}${exercise.modelUrl}`, window.location.href).href;
    const loadStarted = performance.now();
    ghostPromise.current = loadGhost(modelUrl, exercise.previewAnimation ?? "loop");
    ghostPromise.current
      .then(() => {
        console.info(`[MoveX AR] ${exercise.id} trainer ready in ${Math.round(performance.now() - loadStarted)} ms`);
        if (!alive || startedRef.current) return;
        const ua = navigator.userActivation;
        if (ua && !ua.isActive) go("needtap");
        else begin();
      })
      .catch((e) => {
        console.error(e);
        if (alive) {
          const detail = e instanceof Error ? e.message : String(e);
          console.error(`[MoveX AR] ${exercise.id} trainer failed after ${Math.round(performance.now() - loadStarted)} ms`, e);
          setNote(`Trainer model failed to load. ${detail}`);
          go("error");
        }
      });

    const el = overlayRef.current;
    const stop = (e) => {
      if (e.target?.closest?.("[data-xr-ui]")) e.preventDefault();
    };
    el?.addEventListener("beforexrselect", stop);
    return () => {
      alive = false;
      el?.removeEventListener("beforexrselect", stop);
      cleanupRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, loadAttempt]);
  /* ------------------------ real AR: WebXR plane detection ------------------------ */
  const startXR = useCallback(async () => {
    let session = null;
    try {
      session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay", "local-floor", "anchors", "light-estimation", "plane-detection"],
        domOverlay: { root: overlayRef.current },
      });
    } catch (e) {
      console.warn("immersive-ar refused:", e);
      setNote(
        !window.isSecureContext
          ? "Live floor scan needs the https link."
          : "Live floor scan is not available here, so camera mode is used (it estimates the floor)."
      );
      return startCam();
    }

    try {
      const ghost = await ghostPromise.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.xr.enabled = true;
      canvasHostRef.current.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const stageObj = makeStage();
      scene.add(stageObj.lights, stageObj.shadow);
      stageObj.shadow.visible = false;

      const xrLight = new XREstimatedLight(renderer);
      xrLight.addEventListener("estimationstart", () => {
        stageObj.setLightsEnabled(false);
        scene.add(xrLight);
        if (xrLight.environment) scene.environment = xrLight.environment;
      });
      xrLight.addEventListener("estimationend", () => {
        scene.remove(xrLight);
        scene.environment = null;
        stageObj.setLightsEnabled(true);
      });

      const reticle = makeReticle(ghost.footprint);
      reticle.group.visible = false;
      scene.add(reticle.group);
      ghost.root.visible = false;
      ghost.setPreviewMode(true);
      scene.add(ghost.root);

      await renderer.xr.setSession(session);
      const refSpace = renderer.xr.getReferenceSpace();
      const viewerSpace = await session.requestReferenceSpace("viewer");
      let hitSource;
      try {
        hitSource = await session.requestHitTestSource({
          space: viewerSpace,
          entityTypes: ["plane"],
        });
      } catch {
        hitSource = await session.requestHitTestSource({ space: viewerSpace });
      }

      let placeRequested = false;
      let placed = false;
      let anchor = null;
      let popT = 1;
      let placedScale = 1;
      let curScale = 1;
      let lastSpace = 1;
      let stable = 0;
      let lost = 0;
      let fitScore = 0;
      let nofitSince = 0;
      let haveReticle = false;
      const target = new THREE.Vector3();
      const camPos = new THREE.Vector3();
      const normal = new THREE.Vector3();
      const clock = new THREE.Clock();

      const orientationOffset = exercise.cameraView === "front" ? 0 : SIDE_ON;
      const yawToward = (p) =>
        Math.atan2(camPos.x - p.x, camPos.z - p.z) + orientationOffset + extraYawRef.current;

      let ended = false;
      cleanupRef.current = () => {
        try {
          renderer.setAnimationLoop(null);
          hitSource.cancel();
          if (anchor) anchor.delete();
          if (session && !ended) session.end();
        } catch {
          /* already ended */
        }
        renderer.dispose();
        renderer.domElement.remove();
      };

      session.addEventListener("select", () => {
        if (reticle.group.visible && !placed) placeRequested = true;
        else if (reticle.group.visible && placed) placeRequested = true;
      });
      rotateRef.current = () => {
        extraYawRef.current += Math.PI / 2;
        ghost.root.rotation.y = placedYawRef.current + orientationOffset + extraYawRef.current;
      };

      session.addEventListener("end", () => {
        ended = true;
        renderer.setAnimationLoop(null);
        renderer.dispose();
        renderer.domElement.remove();
        cleanupRef.current = null;
        rotateRef.current = null;
        const next = afterEndRef.current;
        afterEndRef.current = null;
        if (next === "start") onStart();
        else if (next === "back") onBack();
        else {
          setModeBoth("none");
          go("needtap");
        }
      });

      renderer.setAnimationLoop((_t, frame) => {
        const dt = clock.getDelta();
        ghost.mixer.update(dt);
        renderer.xr.getCamera().getWorldPosition(camPos);

        if (frame) {
          const hits = frame.getHitTestResults(hitSource);
          let good = false;
          if (hits.length) {
            const pose = hits[0].getPose(refSpace);
            if (pose) {
              const m = pose.transform.matrix;
              normal.set(m[4], m[5], m[6]);
              const hy = m[13];
              const below = camPos.y - hy;
              good =
                normal.y > FLOOR_MIN_UP &&
                below > FLOOR_BELOW_CAM[0] &&
                below < FLOOR_BELOW_CAM[1];
              if (good) target.set(m[12], hy, m[14]);
            }
          }
          if (good) {
            stable = Math.min(stable + 1, 30);
            lost = 0;
          } else {
            lost++;
            if (lost > 6) stable = 0;
          }
          const found = stable >= 4;
          if (found && !placed) {
            if (!haveReticle) {
              reticle.group.position.copy(target);
              haveReticle = true;
              if (navigator.vibrate) navigator.vibrate(15);
            } else if (good) reticle.group.position.lerp(target, 0.35);
          }
          const showReticle = haveReticle && lost <= 20 && !placed;
          reticle.group.visible = showReticle;

          if (!placed) {
            reticle.group.rotation.y = yawToward(reticle.group.position);
            const px = reticle.group.position.x, pz = reticle.group.position.z, py = reticle.group.position.y;
            let spaceScale = null;
            if (found) {
              for (const sc of TRAINER_SCALES) {
                const pts = footprintPoints(px, pz, reticle.group.rotation.y, reticle.half.x * sc, reticle.half.z * sc);
                const fits = fitsDetectedPlane(frame, refSpace, pts, py);
                if (fits === null) {
                  spaceScale = 1;
                  break;
                }
                if (fits) {
                  spaceScale = sc;
                  break;
                }
              }
            }
            if (spaceScale !== null) {
              fitScore = Math.min(10, fitScore + 2);
              lastSpace = spaceScale;
            } else fitScore = Math.max(0, fitScore - 1);
            const spaceOk = fitScore > 3;

            let finalScale = null;
            const xrCams = renderer.xr.getCamera().cameras;
            const pm = xrCams && xrCams[0] && xrCams[0].projectionMatrix.elements;
            if (found && spaceOk) {
              if (pm && pm[0] && pm[5]) {
                const d = Math.hypot(px - camPos.x, pz - camPos.z);
                const camH = Math.max(0.9, camPos.y - py);
                for (const sc of TRAINER_SCALES) {
                  if (sc > lastSpace + 1e-6) continue;
                  const need = fitDistance(ghost.footprint, ghost.height, 1 / pm[0], 1 / pm[5], camH, sc);
                  if (d >= need * 0.92) {
                    finalScale = sc;
                    break;
                  }
                }
              } else finalScale = lastSpace;
            }
            const tooClose = found && spaceOk && finalScale === null;
            const fitOk = spaceOk && finalScale !== null;
            if (finalScale !== null) {
              placedScale = finalScale;
              curScale += (finalScale - curScale) * 0.35;
            }
            reticle.group.scale.setScalar(curScale);
            reticle.setFit(fitOk);

            const showTrainerPreview = showReticle && found;
            ghost.root.visible = showTrainerPreview;
            if (showTrainerPreview) {
              ghost.root.position.copy(reticle.group.position);
              ghost.root.rotation.y = reticle.group.rotation.y;
              ghost.root.scale.setScalar(curScale);
              ghost.setPreviewMode(true);
              stageObj.moveTo(ghost.root.position);
            }

            if (!found) {
              setStatus("scan");
              nofitSince = 0;
            } else if (tooClose && spaceOk) {
              setStatus("close");
              nofitSince = 0;
            } else if (!spaceOk) {
              setStatus("nofit");
              if (!nofitSince) nofitSince = performance.now();
              else if (performance.now() - nofitSince > 1800) setCanForce(true);
            } else {
              setStatus("found");
              nofitSince = 0;
              setCanForce(false);
            }

            const wantPlace = (placeRequested && fitOk) || (forceRef.current && found);
            placeRequested = false;
            if (wantPlace && showReticle) {
              const usedFloorOverride = forceRef.current && !fitOk;
              forceRef.current = false;
              if (usedFloorOverride) placedScale = Math.min(placedScale || 1, 0.65);
              placed = true;
              ghost.root.position.copy(reticle.group.position);
              placedYawRef.current = yawToward(ghost.root.position) - orientationOffset - extraYawRef.current;
              ghost.root.rotation.y = placedYawRef.current + orientationOffset + extraYawRef.current;
              ghost.root.visible = true;
              ghost.setPreviewMode(false);
              ghost.startIntro();
              stageObj.shadow.visible = true;
              stageObj.moveTo(ghost.root.position);
              popT = 0;
              setScalePct(Math.round(placedScale * 100));
              setStatus("placed");
              setCanForce(false);
              go("placed");
              if (navigator.vibrate) navigator.vibrate(20);
              const hit = hits[0];
              if (hit.createAnchor) {
                hit.createAnchor().then((a) => { anchor = a; }).catch(() => {});
              }
            }
          }
        }

        if (placed && placeRequested) {
          placeRequested = false;
          placed = false;
          if (anchor) { anchor.delete(); anchor = null; }
          ghost.root.visible = false;
          ghost.setPreviewMode(true);
          stageObj.shadow.visible = false;
          stable = 10;
          fitScore = 10;
          setStatus("found");
          go("scanning");
        }

        if (anchor && placed && frame) {
          const ap = frame.getPose(anchor.anchorSpace, refSpace);
          if (ap) {
            ghost.root.position.set(ap.transform.position.x, ap.transform.position.y, ap.transform.position.z);
            stageObj.moveTo(ghost.root.position);
          }
        }
        if (popT < 1) popT = Math.min(1, popT + dt / 0.35);
        ghost.root.scale.setScalar(placed ? placedScale * (1 - Math.pow(1 - popT, 3)) : curScale);
        renderer.render(scene, camera);
      });

      setStatus("scan");
      setModeBoth("xr");
      go("scanning");
    } catch (e) {
      console.error(e);
      try {
        await session.end();
      } catch {
        /* ignore */
      }
      setNote("Live floor scan could not start, so camera mode is used (it estimates the floor).");
      startCam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, onStart, onBack]);
  /* ------------- camera mode: back camera + gyroscope, estimated floor ------------- */
  const startCam = useCallback(async () => {
    const motionAllowed = await requestMotionPermission();
    try {
      const ghost = await ghostPromise.current;
      const host = canvasHostRef.current;
      const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 40);
      const gyro = createGyroCamera(camera, CAM_HEIGHT);
      const sensorOk = motionAllowed ? await gyro.start() : false;
      if (!sensorOk) {
        gyro.stop();
        setModeBoth("none");
        setNote(
          "This device did not provide motion-sensor data for floor aiming. Open this HTTPS page in Chrome on an ARCore-supported Android phone, allow camera/motion access, then retry. The workout is not started because the trainer has not been placed."
        );
        go("error");
        return;
      }

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      host.appendChild(renderer.domElement);
      Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", touchAction: "none" });

      const scene = new THREE.Scene();
      const stageObj = makeStage();
      scene.add(stageObj.lights, stageObj.shadow);
      stageObj.shadow.visible = false;
      const reticle = makeReticle(ghost.footprint);
      reticle.group.visible = false;
      scene.add(reticle.group);
      ghost.root.visible = false;
      ghost.setPreviewMode(true);
      scene.add(ghost.root);

      const maxD = 6;
      const distFor = (sc) =>
        fitDistance(
          ghost.footprint,
          ghost.height,
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect,
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)),
          CAM_HEIGHT,
          sc
        );
      const pickScale = () => TRAINER_SCALES.find((sc) => distFor(sc) <= 2.6) || TRAINER_SCALES[TRAINER_SCALES.length - 1];
      let camScale = 1;
      const minDist = () => Math.min(maxD, distFor(camScale));

      const resize = () => {
        const w = host.clientWidth, h = host.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      camScale = pickScale();
      reticle.group.scale.setScalar(camScale);
      window.addEventListener("resize", resize);

      let stream = null;
      let raf = 0;
      let alive = true;
      let placed = false;
      let popT = 1;
      let haveReticle = false;
      const camPos = new THREE.Vector3();
      const orientationOffset = exercise.cameraView === "front" ? 0 : SIDE_ON;
      const yawToward = (p) => {
        camera.getWorldPosition(camPos);
        return Math.atan2(camPos.x - p.x, camPos.z - p.z) + orientationOffset + extraYawRef.current;
      };

      let downX = 0, downY = 0, dragging = false, dragX = 0;
      const down = (e) => {
        downX = dragX = e.clientX;
        downY = e.clientY;
        dragging = true;
      };
      const move = (e) => {
        if (!dragging || sensorOk) return;
        extraYawRef.current += (e.clientX - dragX) * 0.01;
        dragX = e.clientX;
      };
      const up = (e) => {
        dragging = false;
        if (!sensorOk) return;
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 12) return;
        if (!reticle.group.visible) return;
        ghost.root.position.copy(reticle.group.position);
        placedYawRef.current = yawToward(ghost.root.position) - orientationOffset - extraYawRef.current;
        ghost.root.rotation.y = placedYawRef.current + orientationOffset + extraYawRef.current;
        ghost.root.visible = true;
        ghost.setPreviewMode(false);
        ghost.root.scale.setScalar(camScale);
        ghost.startIntro();
        reticle.group.visible = false;
        stageObj.shadow.visible = true;
        stageObj.moveTo(ghost.root.position);
        popT = 0;
        placed = true;
        setScalePct(Math.round(camScale * 100));
        if (navigator.vibrate) navigator.vibrate(20);
        setStatus("placed");
        go("placed");
      };
      host.addEventListener("pointerdown", down);
      host.addEventListener("pointerup", up);
      window.addEventListener("pointermove", move);

      cleanupRef.current = () => {
        alive = false;
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        host.removeEventListener("pointerdown", down);
        host.removeEventListener("pointerup", up);
        window.removeEventListener("pointermove", move);
        gyro.stop();
        if (stream) stream.getTracks().forEach((t) => t.stop());
        renderer.dispose();
        renderer.domElement.remove();
        rotateRef.current = null;
      };
      rotateRef.current = () => {
        extraYawRef.current += Math.PI / 2;
        ghost.root.rotation.y = placedYawRef.current + orientationOffset + extraYawRef.current;
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (!videoRef.current) throw new Error("Camera preview element is unavailable.");
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        if (cleanupRef.current) cleanupRef.current();
        cleanupRef.current = null;
        setNote(`Camera access is required to scan the floor. ${detail}`);
        setModeBoth("none");
        go("error");
        return;
      }

      const clock = new THREE.Clock();
      setStatus("tilt");
      setModeBoth("cam");
      go("scanning");

      const hitPt = new THREE.Vector3();
      const target = new THREE.Vector3();
      let _diagT = 0;
      const tick = () => {
        if (!alive) return;
        const dt = clock.getDelta();
        ghost.mixer.update(dt);
        if (sensorOk) {
          gyro.update();
          if (!placed) {
            const ok = floorHit(camera, 0, -0.1, hitPt, 12);
            // Diagnostic: log floor hit status once per second so we can debug
            // whether the phone orientation is producing a downward ray.
            const nowMs = performance.now();
            if (nowMs - _diagT > 1000) {
              _diagT = nowMs;
              const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
              console.log("[MoveX AR cam] floorHit:", ok, "rayDir.y:", dir.y.toFixed(3), "camQuat:", camera.quaternion.x.toFixed(3), camera.quaternion.y.toFixed(3), camera.quaternion.z.toFixed(3), camera.quaternion.w.toFixed(3));
            }
            if (ok) {
              camera.getWorldPosition(camPos);
              const dx = hitPt.x - camPos.x, dz = hitPt.z - camPos.z;
              const d = Math.hypot(dx, dz) || 1;
              const use = Math.min(maxD, Math.max(minDist(), d));
              target.set(camPos.x + (dx / d) * use, 0, camPos.z + (dz / d) * use);
              if (!haveReticle) {
                reticle.group.position.copy(target);
                haveReticle = true;
              } else reticle.group.position.lerp(target, 0.3);
              reticle.group.rotation.y = yawToward(reticle.group.position);
              reticle.setFit(true);
              reticle.group.visible = true;
              ghost.root.position.copy(reticle.group.position);
              ghost.root.rotation.y = reticle.group.rotation.y;
              ghost.root.scale.setScalar(camScale);
              ghost.root.visible = true;
              ghost.setPreviewMode(true);
              stageObj.moveTo(ghost.root.position);
              setStatus("found");
            } else {
              reticle.group.visible = false;
              if (!placed) ghost.root.visible = false;
              setStatus("tilt");
            }
          }
        }
        if (popT < 1) popT = Math.min(1, popT + dt / 0.35);
        ghost.root.scale.setScalar(camScale * (1 - Math.pow(1 - popT, 3)));
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.error("MoveX AR camera/floor preview failed:", e);
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = null;
      const detail = e instanceof Error ? e.message : String(e);
      setNote(`Could not start floor scanning. ${detail}`);
      setModeBoth("none");
      go("error");
    }
  }, [go, setModeBoth, setStatus, exercise.cameraView]);
  const begin = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Only use WebXR if the immersive-ar session mode is actually available.
    // Chrome exposes navigator.xr even on phones without ARCore, so we must
    // check isSessionSupported before requesting a session.
    // Feature flag: set VITE_ENABLE_AR_XR=false on Render to force camera mode
    // (useful if a specific ARCore device misbehaves during the demo).
    const flagOn = import.meta.env.VITE_ENABLE_AR_XR !== "false";
    let xrSupported = false;
    if (flagOn && navigator.xr && typeof navigator.xr.isSessionSupported === "function") {
      try {
        xrSupported = await navigator.xr.isSessionSupported("immersive-ar");
        console.log("[MoveX AR] isSessionSupported(immersive-ar):", xrSupported);
      } catch (e) {
        console.warn("[MoveX AR] isSessionSupported threw:", e);
      }
    }

    if (xrSupported) {
      startXR();
      return;
    }

    setNote(
      window.isSecureContext
        ? "Camera mode: the floor is estimated. Live floor scan needs Chrome on an ARCore phone."
        : "Live floor scan needs the https link."
    );
    startCam();
  }, [startXR, startCam]);

  const beginWorkout = () => {
    const c = cleanupRef.current;
    if (modeRef.current !== "xr") {
      if (c) c();
      cleanupRef.current = null;
      onStart();
      return;
    }
    afterEndRef.current = "start";
    if (c) c();
  };

  const leave = () => {
    const c = cleanupRef.current;
    cleanupRef.current = null;
    if (modeRef.current === "xr") {
      afterEndRef.current = "back";
      if (c) c();
      return;
    }
    if (c) c();
    onBack();
  };

  const rotate = () => {
    if (rotateRef.current) rotateRef.current();
  };
  const live = stage === "scanning" || stage === "placed";

  const statusText = {
    scan: "Scan slowly across the floor until the trainer preview appears",
    found: "Trainer preview found - tap to place it on this floor position",
    nofit: "Not enough clear floor here. Move to an open spot",
    close: "Aim farther away so the whole trainer fits the screen",
    tilt: "Point the camera at the floor",
    placed:
      "Trainer placed. Tap the floor to move it" +
      (scalePct < 95 ? " - shown at " + scalePct + "% size to fit your space" : ""),
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 overflow-hidden text-white select-none bg-black"
      style={{ background: live ? "transparent" : "#0a0a0a" }}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: mode === "cam" || mode === "static" ? "block" : "none" }}
      />
      <div
        ref={canvasHostRef}
        className="absolute inset-0"
        style={{ pointerEvents: mode === "cam" || mode === "static" ? "auto" : "none" }}
      />

      {/* top: back + one line of instruction */}
      <div
        className="absolute top-0 inset-x-0 px-3 pb-2 flex items-center gap-2"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <button
          data-xr-ui
          onClick={leave}
          className="w-11 h-11 rounded-xl bg-black/60 backdrop-blur-md grid place-items-center shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {live && (
          <div className="bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 flex-1 min-h-11 flex flex-col justify-center">
            <p className="text-[15px] leading-snug font-medium">{statusText[status]}</p>
            {mode === "cam" && status !== "placed" && (
              <p className="text-[12px] text-amber-200 leading-tight">Estimated floor - hold still and aim down</p>
            )}
            {mode === "xr" && status !== "placed" && (
              <p className="text-[12px] text-white/60 leading-tight">Real AR surface scan - the translucent trainer follows the floor target</p>
            )}
            {status === "placed" && (
              <p className="text-[12px] text-white/60 leading-tight">{exercise.placement}</p>
            )}
            {status === "placed" && (
              <p className="text-[12px] text-white/60 leading-tight">Form metric: {exercise.primaryJoint}</p>
            )}
          </div>
        )}
      </div>

      {/* loading / needs a tap / error */}
      {!live && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <h1 className="text-2xl font-semibold">{exercise.name}</h1>
          {stage === "loading" && (
            <div className="flex flex-col items-center gap-2 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading trainer model...
              </div>
              <p className="max-w-xs text-xs text-white/40">
                First load downloads the selected exercise only. If it takes longer than 45 seconds, MoveX AR will show an error so you can retry.
              </p>
            </div>
          )}
          {stage === "needtap" && (
            <button
              data-xr-ui
              onClick={() => {
                startedRef.current = false;
                begin();
              }}
              className="h-14 px-10 rounded-xl bg-white text-black text-lg font-semibold"
            >
              Scan floor
            </button>
          )}
          {stage === "error" && (
            <>
              <p className="text-sm text-white/70 max-w-xs">{note}</p>
              <button
                data-xr-ui
                onClick={() => {
                  startedRef.current = false;
                  setNote(null);
                  setStatus("scan");
                  setModeBoth("none");
                  go("loading");
                  setLoadAttempt((n) => n + 1);
                }}
                className="h-12 px-8 rounded-xl bg-white text-black font-semibold"
              >
                Retry model and floor scan
              </button>
              <p className="text-xs text-white/45 max-w-xs">
                MoveX AR will not start the workout until the model has loaded and you have placed it.
              </p>
            </>
          )}
          {note && stage !== "error" && stage !== "loading" && (
            <p className="text-xs text-white/50 max-w-xs">{note}</p>
          )}
        </div>
      )}

      {/* bottom: workout button once placed, or force-place hint while scanning */}
      {stage === "placed" && (
        <div
          className="absolute bottom-0 inset-x-0 px-3 pt-2 flex items-center gap-2"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            data-xr-ui
            onClick={rotate}
            className="w-14 h-14 rounded-xl bg-black/60 backdrop-blur-md grid place-items-center shrink-0"
            aria-label="Rotate trainer"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <button
            data-xr-ui
            onClick={beginWorkout}
            className="h-14 flex-1 rounded-xl bg-white text-black text-lg font-semibold"
          >
            Start workout
          </button>
        </div>
      )}
      {stage === "scanning" && canForce && mode === "xr" && (
        <div
          className="absolute bottom-0 inset-x-0 px-3 pt-2"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            data-xr-ui
            onClick={() => {
              forceRef.current = true;
              setCanForce(false);
            }}
            className="w-full h-12 rounded-xl bg-black/60 backdrop-blur-md text-[15px] font-medium"
          >
            Place here anyway
          </button>
        </div>
      )}
    </div>
  );
}