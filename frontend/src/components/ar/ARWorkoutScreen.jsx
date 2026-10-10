/**
 * ARWorkoutScreen — immersive camera + HUD + set summary.
 * The summary overlay reuses the MoveX activity report style:
 * gradient background, glass panels, real AVS steps, rewards, impact.
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, Volume2, VolumeX, AlertTriangle, RotateCcw,
  Zap, Trophy, Flame, MapPin, CheckCircle2, XCircle, Sparkles,
  Users, Activity as ActivityIcon,
} from 'lucide-react';
import { usePoseEngine } from '../../hooks/usePoseEngine.js';
import { submitARWorkout } from '../../services/arActivityApi';
import MoveXCard from '../ui/MoveXCard';
import MoveXGlassPanel from '../ui/MoveXGlassPanel';
import Button from '../ui/Button';

const STATUS_TONE = {
  VERIFIED:  { color: 'text-mint-600',  bg: 'bg-mint-500/10  border-mint-500/30',  Icon: CheckCircle2 },
  PROBABLE:  { color: 'text-gold-600',  bg: 'bg-gold-500/10  border-gold-500/30',  Icon: AlertTriangle },
  INVALID:   { color: 'text-red-600',   bg: 'bg-red-500/10   border-red-500/30',   Icon: XCircle },
  RECORDED:  { color: 'text-ink-600',   bg: 'bg-surface-100  border-surface-200',  Icon: ActivityIcon },
};

const ARWorkoutScreen = ({ exercise, summary, onSummaryChange, onExit }) => {
  const [hud, setHud] = useState({
    analysis: null, adjustments: [], reps: 0, repPhase: 'waiting',
    phase: 'boot', countdown: 3, elapsedSec: 0, cue: null,
    cameraReady: false, fps: 0, summary: null,
  });
  const [facing, setFacing] = useState('environment');
  const [voice, setVoice] = useState(true);

  const [submission, setSubmission] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { error, nextSet, finishSet } = usePoseEngine(videoRef, canvasRef, {
    exercise, facing, voice,
    onHud: (patch) => setHud((h) => ({ ...h, ...patch })),
  });

  useEffect(() => {
    if (hud.phase === 'done' && hud.summary && !summary) {
      onSummaryChange(hud.summary);
    }
  }, [hud.phase, hud.summary, summary, onSummaryChange]);

  useEffect(() => {
    if (!summary || submission) return;
    let cancelled = false;
    (async () => {
      setSubmission('loading');
      setSubmitError(null);
      try {
        const res = await submitARWorkout(exercise, summary);
        if (cancelled) return;
        setRewards(res);
        setSubmission('done');
      } catch (err) {
        if (cancelled) return;
        console.error('AR submission failed:', err);
        setSubmitError(err.response?.data?.msg || err.message || 'Submission failed');
        setSubmission('error');
      }
    })();
    return () => { cancelled = true; };
  }, [summary, submission, exercise]);

  const resetSubmissionState = () => {
    setSubmission(null);
    setRewards(null);
    setSubmitError(null);
  };

  const handleNextSet = () => {
    resetSubmissionState();
    onSummaryChange(null);
    nextSet();
  };

  const handleDone = () => {
    resetSubmissionState();
    onSummaryChange(null);
    onExit();
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (error) {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <MoveXCard className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-ink-900 mb-1">Camera issue</h2>
            <p className="text-sm text-ink-500 mb-4">{error}</p>
            <Button variant="primary" fullWidth onClick={onExit}>
              Back to workouts
            </Button>
          </MoveXCard>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <video ref={videoRef} playsInline muted autoPlay
        className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {/* TOP BAR */}
        <div className="flex items-center justify-between p-4 pointer-events-auto">
          <button onClick={onExit}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition"
            aria-label="Exit">
            <X className="w-5 h-5" />
          </button>
          <div className="px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold tabular-nums">
            {exercise.name} · {fmtTime(hud.elapsedSec)}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setVoice((v) => !v)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition"
              aria-label="Toggle voice">
              {voice ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition"
              aria-label="Flip camera">
              <Camera className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CENTER HUD */}
        <div className="flex-1 flex items-center justify-center px-6">
          {hud.phase === 'boot' && (
            <div className="text-white text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              <p className="text-sm">Loading camera and model…</p>
            </div>
          )}
          {hud.phase === 'framing' && (
            <div className="px-6 py-4 rounded-2xl bg-black/60 backdrop-blur-md text-white text-center max-w-xs">
              <p className="text-sm font-semibold mb-1">Fit your full body in frame</p>
              <p className="text-xs opacity-80">Hold still for 1 second to start</p>
            </div>
          )}
          {hud.phase === 'countdown' && (
            <AnimatePresence mode="wait">
              <motion.div key={hud.countdown}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.8, opacity: 0 }} transition={{ duration: 0.4 }}
                className="text-white text-[140px] font-bold tabular-nums leading-none">
                {hud.countdown}
              </motion.div>
            </AnimatePresence>
          )}
          {hud.phase === 'live' && (
            <div className="text-white text-center">
              <p className="text-[140px] font-extrabold tabular-nums leading-none drop-shadow-2xl">
                {hud.reps}
              </p>
              <p className="text-xs uppercase tracking-widest opacity-70 mt-2">
                reps · target {exercise.targetReps}
              </p>
            </div>
          )}
        </div>

        {/* CUE FLASH */}
        <div className="flex justify-center mb-3 min-h-[44px]">
          <AnimatePresence>
            {hud.cue && hud.phase === 'live' && (
              <motion.div key={hud.cue.id}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.9 }} transition={{ duration: 0.2 }}
                className={`px-4 py-2 rounded-full backdrop-blur-md text-white text-sm font-semibold shadow-lg ${
                  hud.cue.tone === 'good' ? 'bg-emerald-500/80'
                    : hud.cue.tone === 'warn' ? 'bg-amber-500/85'
                    : 'bg-blue-500/80'
                }`}>
                {hud.cue.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="p-4 pointer-events-auto flex items-center justify-center gap-3">
          {hud.phase === 'live' && (
            <button onClick={finishSet}
              className="px-8 py-3 rounded-full bg-white text-black font-semibold active:scale-95 transition">
              Finish set
            </button>
          )}
        </div>
      </div>

      {/* ============================================================
          ENHANCED REPORT OVERLAY — matches MoveX activity report
          ============================================================ */}
      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 overflow-y-auto bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#E0E7FF]"
          >
            <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#2563EB]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#2563EB]/8 blur-3xl pointer-events-none" />

            <div className="relative max-w-md mx-auto p-4 py-8 space-y-3">
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="space-y-3"
              >
                {/* HEADER */}
                <MoveXGlassPanel className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-3">
                    MoveX AR Report
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl icon-tile-blue flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-base font-bold text-ink-900">{summary.exercise}</span>
                  </div>

                  {rewards && (() => {
                    const status = STATUS_TONE[rewards.decision] || STATUS_TONE.RECORDED;
                    const StatusIcon = status.Icon;
                    return (
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${status.bg} mb-1`}>
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        <span className={`text-sm font-bold ${status.color}`}>{rewards.decision}</span>
                      </div>
                    );
                  })()}

                  <div className="flex items-stretch justify-center gap-3 sm:gap-6 text-left mt-4">
                    <div className="flex-1 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Reps</p>
                      <p className="text-base font-bold text-ink-900 mt-0.5 tabular-nums">
                        {summary.reps}<span className="text-xs text-ink-400">/{summary.target}</span>
                      </p>
                    </div>
                    <div className="w-px bg-ink-900/10" />
                    <div className="flex-1 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Duration</p>
                      <p className="text-base font-bold text-ink-900 mt-0.5 tabular-nums">
                        {Math.floor(summary.durationSec / 60)}:{String(summary.durationSec % 60).padStart(2, '0')}
                      </p>
                    </div>
                    <div className="w-px bg-ink-900/10" />
                    <div className="flex-1 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Accuracy</p>
                      <p className={`text-base font-bold mt-0.5 tabular-nums ${
                        summary.accuracy >= 90 ? 'text-mint-600'
                          : summary.accuracy >= 75 ? 'text-[#2563EB]'
                          : summary.accuracy >= 55 ? 'text-gold-600'
                          : 'text-red-600'
                      }`}>{summary.accuracy}%</p>
                    </div>
                  </div>
                </MoveXGlassPanel>

                {/* SUBMITTING / REWARDS */}
                {submission === 'loading' && (
                  <MoveXGlassPanel className="text-center">
                    <div className="flex items-center justify-center gap-2 text-ink-600 text-sm">
                      <div className="w-4 h-4 rounded-full border-2 border-[#2563EB]/30 border-t-[#2563EB] animate-spin" />
                      Submitting to MoveX…
                    </div>
                  </MoveXGlassPanel>
                )}

                {submission === 'done' && rewards && (
                  <>
                    <MoveXGlassPanel>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3 text-center">
                        Your Rewards
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <div className="w-9 h-9 mx-auto rounded-xl bg-gold-500/15 flex items-center justify-center mb-1.5">
                            <Zap className="w-4 h-4 text-gold-600" />
                          </div>
                          <p className="font-bold text-ink-900 tabular-nums text-sm">+{rewards.energy}</p>
                          <p className="text-[9px] text-ink-500 uppercase tracking-wider">Energy</p>
                        </div>
                        <div className="text-center">
                          <div className="w-9 h-9 mx-auto rounded-xl bg-[#2563EB]/15 flex items-center justify-center mb-1.5">
                            <Trophy className="w-4 h-4 text-[#2563EB]" />
                          </div>
                          <p className="font-bold text-ink-900 tabular-nums text-sm">+{rewards.xp}</p>
                          <p className="text-[9px] text-ink-500 uppercase tracking-wider">XP</p>
                        </div>
                        <div className="text-center">
                          <div className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center mb-1.5 ${
                            rewards.trophy ? 'bg-purple-500/15' : 'bg-surface-100'
                          }`}>
                            <Trophy className={`w-4 h-4 ${rewards.trophy ? 'text-purple-600' : 'text-ink-400'}`} />
                          </div>
                          <p className={`font-bold tabular-nums text-sm ${rewards.trophy ? 'text-ink-900' : 'text-ink-400'}`}>
                            +{rewards.trophy ? 1 : 0}
                          </p>
                          <p className="text-[9px] text-ink-500 uppercase tracking-wider">Trophy</p>
                        </div>
                        <div className="text-center">
                          <div className="w-9 h-9 mx-auto rounded-xl bg-ember-500/15 flex items-center justify-center mb-1.5">
                            <Flame className="w-4 h-4 text-ember-500" />
                          </div>
                          <p className="font-bold text-ink-900 tabular-nums text-sm">{rewards.streak}d</p>
                          <p className="text-[9px] text-ink-500 uppercase tracking-wider">Streak</p>
                        </div>
                      </div>
                      {rewards.trophy && (
                        <div className="mt-3 pt-3 border-t border-ink-900/10 text-center">
                          <p className="text-[10px] uppercase tracking-widest text-purple-600 font-bold mb-0.5">
                            Trophy Earned
                          </p>
                          <p className="text-sm font-semibold text-[#2563EB]">{rewards.trophy}</p>
                        </div>
                      )}
                    </MoveXGlassPanel>

                    {/* IMPACT */}
                    {rewards.community && (rewards.community.region || rewards.community.city || rewards.community.state) && (
                      <MoveXGlassPanel>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3 text-center">
                          Your Impact
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-ink-700">
                            <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                            <span className="truncate">
                              {[rewards.community.region, rewards.community.city, rewards.community.state]
                                .filter(Boolean).join(' · ')}
                            </span>
                            {rewards.communityContribution > 0 && (
                              <span className="ml-auto font-semibold text-[#2563EB] shrink-0 tabular-nums">
                                +{rewards.communityContribution}
                              </span>
                            )}
                          </div>
                          {rewards.clanEnergyContribution > 0 && (
                            <div className="flex items-center gap-2 text-ink-700">
                              <Users className="w-4 h-4 text-[#2563EB] shrink-0" />
                              <span>Clan</span>
                              <span className="ml-auto font-semibold text-[#2563EB] shrink-0 tabular-nums">
                                +{rewards.clanEnergyContribution}
                              </span>
                            </div>
                          )}
                        </div>
                      </MoveXGlassPanel>
                    )}

                    {/* AVS PIPELINE */}
                    {rewards.steps && rewards.steps.length > 0 && (
                      <MoveXGlassPanel>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                            Verification
                          </p>
                          <p className="text-sm font-bold text-[#2563EB] tabular-nums">{rewards.avs}/100</p>
                        </div>
                        <ul className="space-y-1">
                          {rewards.steps.map((s) => {
                            const cfg = s.status === 'GREEN'
                              ? { color: 'text-mint-600', bg: 'bg-mint-500/10', Icon: CheckCircle2, tag: 'Pass' }
                              : s.status === 'ORANGE'
                              ? { color: 'text-gold-600', bg: 'bg-gold-500/10', Icon: AlertTriangle, tag: 'Partial' }
                              : { color: 'text-red-600', bg: 'bg-red-500/10', Icon: XCircle, tag: 'Fail' };
                            const Icon = cfg.Icon;
                            return (
                              <li key={s.step} className="flex items-center gap-3 py-1.5 border-b border-ink-900/5 last:border-0">
                                <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-ink-900 truncate">{s.name}</p>
                                  {s.detail && <p className="text-[10px] text-ink-500 truncate">{s.detail}</p>}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color} shrink-0`}>
                                  {cfg.tag}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </MoveXGlassPanel>
                    )}
                  </>
                )}

                {submission === 'error' && (
                  <MoveXGlassPanel className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-red-500/10 flex items-center justify-center mb-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-xs text-red-600 mb-1">{submitError}</p>
                    <p className="text-[11px] text-ink-500">
                      Rewards not awarded. Your form data is saved on this device.
                    </p>
                  </MoveXGlassPanel>
                )}

                {/* FORM BREAKDOWN — always visible */}
                <MoveXGlassPanel>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3 text-center">
                    Form Breakdown
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Best</p>
                      <p className="text-xl font-bold text-mint-600 mt-1 tabular-nums">{summary.best}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Worst</p>
                      <p className="text-xl font-bold text-red-600 mt-1 tabular-nums">{summary.worst}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Partial</p>
                      <p className={`text-xl font-bold mt-1 tabular-nums ${
                        summary.partials === 0 ? 'text-mint-600' : 'text-gold-600'
                      }`}>{summary.partials}</p>
                    </div>
                  </div>
                </MoveXGlassPanel>

                {/* ISSUES TO WORK ON */}
                {summary.issues && summary.issues.length > 0 && (
                  <MoveXGlassPanel>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3 text-center">
                      What to Work On
                    </p>
                    <ul className="space-y-2.5">
                      {summary.issues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gold-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-gold-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-ink-800">{issue.label}</p>
                            <p className="text-[10px] text-ink-500">{issue.count} reps affected</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </MoveXGlassPanel>
                )}

                {/* REMARK */}
                <MoveXGlassPanel className="text-center">
                  <p className="text-xs text-ink-700 italic leading-relaxed">
                    "{summary.remark}"
                  </p>
                </MoveXGlassPanel>

                {/* ACTIONS */}
                <div className="space-y-2 pt-1">
                  <Button variant="premium" size="lg" fullWidth onClick={handleNextSet} icon={RotateCcw}>
                    Next set
                  </Button>
                  <Button variant="secondary" fullWidth onClick={handleDone}>
                    Done
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ARWorkoutScreen;