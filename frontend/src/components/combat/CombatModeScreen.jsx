/**
 * CombatModeScreen.jsx
 * ============================================================
 * Pro-only combat training mode for MoveX.
 *
 * Three phases:
 *   setup  -> light MoveX UI (matches dashboard + start page)
 *   live   -> dark fight-night HUD (intentional contrast for focus)
 *   report -> light MoveX report (matches other MoveX reports)
 *
 * Data source: combatSessionService.
 * v10.1 combat fields auto-populate when firmware is flashed.
 * ============================================================
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Square, Heart, Flame, Zap, Shield, Bluetooth,
  AlertTriangle, CheckCircle2, XCircle, RotateCcw, Swords, ArrowRight,
} from 'lucide-react';
import MoveXCard from '../ui/MoveXCard';
import MoveXGlassPanel from '../ui/MoveXGlassPanel';
import Button from '../ui/Button';
import SportModeSelector from './SportModeSelector';
import { createCombatSession } from '../../services/combatSessionService';
import { getAthloniaBandService } from '../../services/athloniaBandService';
import API from '../../api';

const ROUND_PRESETS = [
  { id: '3x3', rounds: 3, roundSec: 180, restSec: 60, label: '3 \u00D7 3 min', desc: 'Standard boxing' },
  { id: '5x3', rounds: 5, roundSec: 180, restSec: 60, label: '5 \u00D7 3 min', desc: 'Championship' },
  { id: '3x2', rounds: 3, roundSec: 120, restSec: 60, label: '3 \u00D7 2 min', desc: 'Quick session' },
];

const fmtTime = (sec) => {
  if (sec == null || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
};

const scoreColor = (v) => {
  if (v >= 80) return 'text-mint-600';
  if (v >= 60) return 'text-[#2563EB]';
  if (v >= 40) return 'text-gold-600';
  return 'text-red-600';
};

const CombatModeScreen = ({ onExit }) => {
  const [phase, setPhase] = useState('setup');
  const [discipline, setDiscipline] = useState('boxing');
  const [presetId, setPresetId] = useState('3x3');
  const [snapshot, setSnapshot] = useState(null);
  const [report, setReport] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const [bandConnected, setBandConnected] = useState(false);
  const [sessionError, setSessionError] = useState(null);

  const sessionRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    const check = () => {
      try {
        const band = getAthloniaBandService();
        setBandConnected(!!(band && band.connected));
      } catch { setBandConnected(false); }
    };
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => {
    if (unsubRef.current) { try { unsubRef.current(); } catch {} }
    if (sessionRef.current) { try { sessionRef.current.destroy(); } catch {} }
  }, []);

  const handleStart = () => {
    setSessionError(null);
    const preset = ROUND_PRESETS.find((p) => p.id === presetId) || ROUND_PRESETS[0];
    const session = createCombatSession({
      discipline,
      roundsPlanned: preset.rounds,
      roundDurationSec: preset.roundSec,
      restDurationSec: preset.restSec,
    });
    const unsub = session.subscribe((event, data) => {
      if (event === 'tick') setSnapshot(data);
      else if (event === 'state') setSnapshot((s) => ({ ...(s || {}), ...data }));
      else if (event === 'session_end') { setReport(data); setPhase('report'); postSession(data); }
      else if (event === 'error') setSessionError(data?.message || 'Session error');
    });
    sessionRef.current = session;
    unsubRef.current = unsub;
    const ok = session.start();
    if (!ok) { setSessionError('Could not start. Is the band connected?'); return; }
    setPhase('live');
  };

  const handleEnd = () => {
    if (sessionRef.current) { try { sessionRef.current.end(); } catch {} }
  };

  const handleRestart = () => {
    if (unsubRef.current) { try { unsubRef.current(); } catch {} }
    if (sessionRef.current) { try { sessionRef.current.destroy(); } catch {} }
    unsubRef.current = null;
    sessionRef.current = null;
    setSnapshot(null); setReport(null); setPostError(null); setSessionError(null);
    setPhase('setup');
  };

  const postSession = async (payload) => {
    setPosting(true); setPostError(null);
    try {
      const totalSec = Math.max(1, Math.floor((payload.endedAt - payload.startedAt) / 1000));
      await API.post('/activity', {
        type: 'workout',
        distance: 0,
        duration: Number((totalSec / 60).toFixed(2)),
        rawData: { source: 'combat', combat: payload },
      });
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.message || 'Save failed';
      setPostError(msg);
    } finally { setPosting(false); }
  };

  // ============================================================
  // SETUP — light MoveX styling
  // ============================================================
  if (phase === 'setup') {
    return (
      <div className="fixed inset-0 z-[10000] overflow-y-auto bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#E0E7FF]">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#2563EB]/8 blur-3xl pointer-events-none" />

        <div className="relative max-w-md mx-auto p-4 py-6 space-y-4 pb-10">
          {/* TOP BAR */}
          <div className="flex items-center justify-between">
            <button
              onClick={onExit}
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-premium text-ink-700 flex items-center justify-center active:scale-95 transition"
              aria-label="Exit"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur shadow-premium text-[10px] font-bold uppercase tracking-widest text-red-600">
              <Swords className="w-3 h-3" />
              Combat Training
            </span>
            <div className={
              'w-10 h-10 rounded-full flex items-center justify-center backdrop-blur shadow-premium ' +
              (bandConnected ? 'bg-mint-500/15 text-mint-600' : 'bg-red-500/15 text-red-500')
            }>
              <Bluetooth className="w-5 h-5" />
            </div>
          </div>

          {/* HERO */}
          <div
            className="relative overflow-hidden rounded-hero p-5 sm:p-6 text-white shadow-hero"
            style={{ background: 'linear-gradient(135deg, #7C2D12 0%, #B91C1C 55%, #991B1B 100%)' }}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-[9px] font-bold uppercase tracking-widest mb-3">
                <Swords className="w-2.5 h-2.5" />
                Pro Athlete
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-1">
                Pick your fight
              </h1>
              <p className="text-sm text-white/85 leading-relaxed">
                Choose your discipline and rounds. Strike counting, HR zones, and round-by-round breakdown run live.
              </p>
            </div>
          </div>

          {/* BAND STATUS WARNING */}
          {!bandConnected && (
            <div className="rounded-panel border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">Band not connected</p>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  Connect your APEX band from the Pro dashboard to enable strike tracking.
                </p>
              </div>
            </div>
          )}

          {sessionError && (
            <div className="rounded-panel border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-sm text-red-900 flex-1">{sessionError}</p>
            </div>
          )}

          {/* SPORT MODE — inside a MoveXCard */}
          <MoveXCard>
            <SportModeSelector
              value={discipline}
              onChange={(next) => setDiscipline(next)}
              variant="light"
            />
          </MoveXCard>

          {/* ROUNDS — inside a MoveXCard */}
          <MoveXCard>
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-500">
                Rounds
              </p>
              <div className="space-y-2">
                {ROUND_PRESETS.map((p) => {
                  const active = presetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPresetId(p.id)}
                      className={
                        'w-full rounded-card p-3.5 flex items-center justify-between transition active:scale-[0.99] ' +
                        (active
                          ? 'bg-[#2563EB]/8 border-2 border-[#2563EB] shadow-md shadow-[#2563EB]/10'
                          : 'bg-white border border-surface-200 hover:border-surface-300 hover:shadow-sm')
                      }
                    >
                      <div className="text-left">
                        <p className={'text-sm font-semibold ' + (active ? 'text-[#2563EB]' : 'text-ink-900')}>
                          {p.label}
                        </p>
                        <p className="text-[11px] text-ink-500 mt-0.5">{p.desc}</p>
                      </div>
                      <div className={
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ' +
                        (active ? 'border-[#2563EB] bg-[#2563EB]' : 'border-surface-300 bg-white')
                      }>
                        {active && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </MoveXCard>

          {/* START BUTTON */}
          <button
            onClick={handleStart}
            disabled={!bandConnected}
            className={
              'w-full py-4 rounded-card font-bold text-base transition active:scale-[0.98] flex items-center justify-center gap-2 ' +
              (bandConnected
                ? 'bg-gradient-to-b from-[#DC2626] to-[#991B1B] text-white shadow-lg shadow-red-600/25'
                : 'bg-surface-100 text-ink-400 cursor-not-allowed')
            }
          >
            <Play className="w-5 h-5" />
            Start Session
            {bandConnected && <ArrowRight className="w-4 h-4 ml-1 opacity-70" />}
          </button>

          {!bandConnected && (
            <p className="text-[11px] text-ink-500 text-center -mt-1">
              Connect your band to unlock Start Session.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // LIVE — dark fight-night HUD (intentional)
  // ============================================================
  if (phase === 'live') {
    const s = snapshot || {};
    const isFighting = s.state === 'fighting';
    const isResting = s.state === 'resting';
    const roundProgress = isFighting && s.roundRemaining != null && s.roundElapsed != null
      ? Math.min(100, (s.roundElapsed / (s.roundElapsed + s.roundRemaining)) * 100) : 0;

    return (
      <div className="fixed inset-0 z-[10000] bg-gradient-to-br from-[#0B1220] via-[#1A0F1A] to-[#0B1220] overflow-hidden">
        <div className="h-full max-w-md mx-auto flex flex-col">
          <div className="flex items-center justify-between p-4">
            <button onClick={handleEnd} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95" aria-label="End">
              <Square className="w-5 h-5" />
            </button>
            <div className="px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold tabular-nums">
              Round {s.round || 1} / {s.roundsPlanned || 3}
            </div>
            <div className={'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ' +
              (isFighting ? 'bg-red-500/20 text-red-300' : isResting ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-white/60')}>
              {isFighting ? 'FIGHT' : isResting ? 'REST' : 'IDLE'}
            </div>
          </div>

          <div className="text-center mt-2">
            <p className={'text-6xl font-extrabold tabular-nums leading-none ' + (isFighting ? 'text-white' : 'text-blue-300')}>
              {fmtTime(s.roundRemaining || 0)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mt-2">
              {isFighting ? 'Remaining' : isResting ? 'Rest' : 'Get ready'}
            </p>
          </div>

          <div className="px-6 mt-4">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className={'h-full rounded-full transition-all ' + (isFighting ? 'bg-red-500' : 'bg-blue-500')}
                style={{ width: roundProgress + '%' }} />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AnimatePresence mode="popLayout">
                <motion.p key={s.totalStrikes || 0}
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="text-[140px] font-extrabold tabular-nums leading-none text-white drop-shadow-2xl">
                  {s.totalStrikes || 0}
                </motion.p>
              </AnimatePresence>
              <p className="text-xs uppercase tracking-widest text-white/50 mt-2">strikes this session</p>
              <p className="text-[11px] text-white/40 mt-1 tabular-nums">{s.strikesThisRound || 0} this round</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
              <Heart className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white tabular-nums">{s.lastHR || '--'}</p>
              <p className="text-[9px] uppercase tracking-widest text-white/40">bpm</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
              <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white tabular-nums">{s.peakImpact ? s.peakImpact.toFixed(1) : '--'}</p>
              <p className="text-[9px] uppercase tracking-widest text-white/40">peak g</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
              <Zap className="w-4 h-4 text-[#60A5FA] mx-auto mb-1" />
              <p className="text-lg font-bold text-white tabular-nums">{s.elapsed ? Math.round((s.totalStrikes || 0) / (s.elapsed / 60)) : 0}</p>
              <p className="text-[9px] uppercase tracking-widest text-white/40">spm</p>
            </div>
          </div>

          {s.stale && (
            <div className="mx-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-100">Band signal lost. Strikes may not be counted.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // REPORT — light MoveX report
  // ============================================================
  const r = report || {};
  const t = r.totals || {};
  const rounds = r.rounds || [];
  const dist = r.strikeTypeDistribution || { straight: 0, hook: 0, uppercut: 0, block: 0 };
  const distTotal = (dist.straight + dist.hook + dist.uppercut + dist.block) || 1;

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#E0E7FF]">
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#2563EB]/10 blur-3xl pointer-events-none" />
      <div className="relative max-w-md mx-auto p-4 py-8 space-y-3">
        <MoveXGlassPanel className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-3">MoveX Combat Report</p>
          <h2 className="text-xl font-bold text-ink-900 capitalize">
            {r.discipline || 'Combat'} - {rounds.length} rounds
          </h2>
          {posting && <p className="text-xs text-ink-500 mt-3">Saving to MoveX...</p>}
          {postError && <p className="text-xs text-red-600 mt-3">Save failed: {postError}</p>}
          {!posting && !postError && (
            <p className="text-xs text-mint-600 mt-3 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </p>
          )}
        </MoveXGlassPanel>

        <div className="grid grid-cols-3 gap-2">
          <MoveXGlassPanel className="text-center py-4">
            <Shield className="w-5 h-5 text-[#2563EB] mx-auto mb-1" />
            <p className={'text-2xl font-bold tabular-nums ' + scoreColor(t.powerScore)}>{t.powerScore || 0}</p>
            <p className="text-[9px] uppercase tracking-widest text-ink-500 mt-1">Power</p>
          </MoveXGlassPanel>
          <MoveXGlassPanel className="text-center py-4">
            <Flame className="w-5 h-5 text-gold-600 mx-auto mb-1" />
            <p className={'text-2xl font-bold tabular-nums ' + scoreColor(t.enduranceScore)}>{t.enduranceScore || 0}</p>
            <p className="text-[9px] uppercase tracking-widest text-ink-500 mt-1">Endurance</p>
          </MoveXGlassPanel>
          <MoveXGlassPanel className="text-center py-4">
            <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className={'text-2xl font-bold tabular-nums ' + scoreColor(t.conditioningIndex)}>{t.conditioningIndex || 0}</p>
            <p className="text-[9px] uppercase tracking-widest text-ink-500 mt-1">Conditioning</p>
          </MoveXGlassPanel>
        </div>

        <MoveXGlassPanel>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3 text-center">Session Totals</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-ink-900 tabular-nums">{t.strikes || 0}</p>
              <p className="text-[9px] uppercase tracking-widest text-ink-500 mt-0.5">Strikes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-ink-900 tabular-nums">{t.avgStrikeRate || 0}</p>
              <p className="text-[9px] uppercase tracking-widest text-ink-500 mt-0.5">Strikes/min</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-ink-900 tabular-nums">{(t.hardestImpact || 0).toFixed(1)}<span className="text-xs text-ink-400">g</span></p>
              <p className="text-[9px] uppercase tracking-widest text-ink-500 mt-0.5">Peak impact</p>
            </div>
          </div>
        </MoveXGlassPanel>

        {(dist.straight + dist.hook + dist.uppercut + dist.block) > 0 && (
          <MoveXGlassPanel>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3 text-center">Strike Type Distribution</p>
            <div className="space-y-3">
              {[
                { key: 'straight', label: 'Straight', color: 'bg-[#2563EB]', val: dist.straight },
                { key: 'hook', label: 'Hook', color: 'bg-red-500', val: dist.hook },
                { key: 'uppercut', label: 'Uppercut', color: 'bg-gold-500', val: dist.uppercut },
                { key: 'block', label: 'Block', color: 'bg-ink-400', val: dist.block },
              ].map((row) => {
                const pct = Math.round((row.val / distTotal) * 100);
                return (
                  <div key={row.key} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-ink-700 w-20 shrink-0">{row.label}</span>
                    <div className="flex-1 bg-surface-100 rounded-full h-3 overflow-hidden">
                      <div className={'h-3 rounded-full ' + row.color} style={{ width: Math.max(pct, 2) + '%' }} />
                    </div>
                    <span className="text-xs font-bold text-ink-900 tabular-nums w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </MoveXGlassPanel>
        )}

        <MoveXGlassPanel>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3 text-center">Round Breakdown</p>
          <div className="space-y-2">
            {rounds.map((rd) => (
              <div key={rd.round} className="flex items-center justify-between gap-3 py-2 border-b border-ink-900/5 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#2563EB]">R{rd.round}</span>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-ink-500 text-[9px] uppercase tracking-wider">Strikes</p>
                    <p className="font-bold text-ink-900 tabular-nums">{rd.strikes}</p>
                  </div>
                  <div>
                    <p className="text-ink-500 text-[9px] uppercase tracking-wider">Rate</p>
                    <p className="font-bold text-ink-900 tabular-nums">{rd.strikeRate}<span className="text-ink-400 text-[10px]"> spm</span></p>
                  </div>
                  <div>
                    <p className="text-ink-500 text-[9px] uppercase tracking-wider">HR avg</p>
                    <p className="font-bold text-ink-900 tabular-nums">
                      {rd.hrAvg || '--'}
                      {rd.recoveryDrop != null && rd.recoveryDrop > 0 && (
                        <span className="text-mint-600 text-[10px] ml-1">-{rd.recoveryDrop}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </MoveXGlassPanel>

        <MoveXGlassPanel className="text-center">
          <p className="text-[11px] text-ink-600 leading-relaxed">
            Strike count and peak impact come from the band's on-board detector.
            Round timer and HR sync from the APEX packet at 10 Hz.
            {' '}
            <span className="font-semibold text-ink-700">
              Punch type classification (jab / hook / uppercut) is coming in the next firmware update.
            </span>
          </p>
        </MoveXGlassPanel>

        <div className="space-y-2 pt-1">
          <Button variant="premium" size="lg" fullWidth onClick={handleRestart} icon={RotateCcw}>Train Again</Button>
          <Button variant="secondary" fullWidth onClick={onExit}>Done</Button>
        </div>
      </div>
    </div>
  );
};

export default CombatModeScreen;