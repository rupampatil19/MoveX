/**
 * APEX Fitness Band widget - Pro-only.
 * Renders nothing if Web Bluetooth isn't supported (iOS, Firefox, etc.).
 * Reads from useAthloniaBand(), which wraps the shared band service singleton.
 */
import {
  Heart, Footprints, Battery, Bluetooth, X, Activity,
  Flame, Route, Zap, TrendingUp, Timer, Gauge,
} from 'lucide-react';
import MoveXCard from '../ui/MoveXCard';
import Button from '../ui/Button';
import { useAthloniaBand } from '../../hooks/useAthloniaBand';

const formatDuration = (sec) => {
  if (!sec || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
};

const ACTIVITY_COLORS = {
  resting:   'bg-surface-100 text-ink-600',
  candidate: 'bg-amber-500/15 text-amber-700',
  walking:   'bg-mint-500/15 text-mint-700',
  running:   'bg-red-500/15 text-red-700',
  workout:   'bg-[#2563EB]/15 text-[#2563EB]',
};

const AthloniaBandWidget = () => {
  const {
    supported, connected, connecting, deviceName, latest,
    averageHR, error, connect, disconnect,
  } = useAthloniaBand();

  if (!supported) return null;

  // ---------- Disconnected: connect card ----------
  if (!connected) {
    return (
      <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center shrink-0">
            <Bluetooth className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink-900">Connect APEX Fitness Band</p>
            <p className="text-xs text-ink-500 mt-0.5 truncate">
              {error || 'Live heart rate, steps, calories and training load'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={Bluetooth}
            loading={connecting}
            onClick={connect}
          >
            {connecting ? 'Connecting' : 'Connect'}
          </Button>
        </div>
      </MoveXCard>
    );
  }

  // ---------- Connected: live widget ----------
  const hr = latest?.heart_rate || 0;
  const hrValid = latest?.hr_valid;
  const steps = latest?.steps || 0;
  const cadence = latest?.cadence || 0;
  const battery = latest?.battery ?? 0;
  const hrDisplay = hrValid && hr > 0 ? hr : '\u2014';

  const activityName = latest?.activity_name || 'resting';
  const sessionTime = latest?.session_time || 0;
  const intensity = latest?.intensity || 0;
  const calories = latest?.calories || 0;
  const distanceM = latest?.distance_m || 0;
  const speedKmh = latest?.speed_kmh || 0;
  const trainingLoad = latest?.training_load || 0;

  const activityColor = ACTIVITY_COLORS[activityName] || ACTIVITY_COLORS.resting;

  return (
    <MoveXCard variant="premium" padded={false} className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-mint-500/15 flex items-center justify-center shrink-0">
            <Bluetooth className="w-4 h-4 text-mint-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">
              {deviceName || 'APEX Fitness Band'}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-mint-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse" />
              Live
            </p>
          </div>
        </div>
        <button
          onClick={disconnect}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
          aria-label="Disconnect band"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Activity banner */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ' + activityColor}>
          <Activity className="w-3 h-3" />
          {activityName}
        </span>
        <div className="flex items-center gap-3 text-xs text-ink-600">
          <span className="inline-flex items-center gap-1">
            <Timer className="w-3.5 h-3.5 text-ink-400" />
            <span className="font-semibold tabular-nums">{formatDuration(sessionTime)}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-ink-400" />
            <span className="font-semibold tabular-nums">{intensity}%</span>
          </span>
        </div>
      </div>

      {/* Primary 3-up: HR / Steps / Battery */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className={'w-9 h-9 mx-auto rounded-xl flex items-center justify-center mb-1.5 ' + (hrValid ? 'bg-red-500/15' : 'bg-surface-100')}>
            <Heart className={'w-4 h-4 ' + (hrValid ? 'text-red-500' : 'text-ink-400')} />
          </div>
          <p className={'font-bold tabular-nums text-base ' + (hrValid ? 'text-ink-900' : 'text-ink-400')}>
            {hrDisplay}
          </p>
          <p className="text-[9px] text-ink-500 uppercase tracking-wider">bpm</p>
        </div>

        <div className="text-center">
          <div className="w-9 h-9 mx-auto rounded-xl bg-[#2563EB]/15 flex items-center justify-center mb-1.5">
            <Footprints className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="font-bold text-ink-900 tabular-nums text-base">
            {steps.toLocaleString()}
          </p>
          <p className="text-[9px] text-ink-500 uppercase tracking-wider">Steps</p>
        </div>

        <div className="text-center">
          <div className={'w-9 h-9 mx-auto rounded-xl flex items-center justify-center mb-1.5 ' + (battery > 20 ? 'bg-mint-500/15' : 'bg-amber-500/15')}>
            <Battery className={'w-4 h-4 ' + (battery > 20 ? 'text-mint-600' : 'text-amber-600')} />
          </div>
          <p className="font-bold text-ink-900 tabular-nums text-base">{battery}%</p>
          <p className="text-[9px] text-ink-500 uppercase tracking-wider">Battery</p>
        </div>
      </div>

      {/* Secondary 3-up: Cadence / Calories / Distance */}
      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-surface-100">
        <div className="text-center">
          <p className="text-[9px] text-ink-500 uppercase tracking-wider mb-0.5">Cadence</p>
          <p className="text-sm font-bold text-ink-900 tabular-nums">
            {cadence}<span className="text-[10px] font-medium text-ink-500 ml-0.5">spm</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-ink-500 uppercase tracking-wider mb-0.5">Calories</p>
          <p className="text-sm font-bold text-ink-900 tabular-nums">
            {calories}<span className="text-[10px] font-medium text-ink-500 ml-0.5">kcal</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-ink-500 uppercase tracking-wider mb-0.5">Distance</p>
          <p className="text-sm font-bold text-ink-900 tabular-nums">
            {(distanceM / 1000).toFixed(2)}<span className="text-[10px] font-medium text-ink-500 ml-0.5">km</span>
          </p>
        </div>
      </div>

      {/* Tertiary 3-up: Avg HR / Training Load / Speed */}
      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-surface-100">
        <div className="text-center">
          <p className="text-[9px] text-ink-500 uppercase tracking-wider mb-0.5">Avg HR</p>
          <p className="text-sm font-bold text-ink-900 tabular-nums">
            {averageHR > 0 ? averageHR : '\u2014'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-ink-500 uppercase tracking-wider mb-0.5">Load</p>
          <p className="text-sm font-bold text-ink-900 tabular-nums">
            {trainingLoad.toFixed(1)}<span className="text-[10px] font-medium text-ink-500 ml-0.5">au</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-ink-500 uppercase tracking-wider mb-0.5">Speed</p>
          <p className="text-sm font-bold text-ink-900 tabular-nums">
            {speedKmh.toFixed(1)}<span className="text-[10px] font-medium text-ink-500 ml-0.5">km/h</span>
          </p>
        </div>
      </div>
    </MoveXCard>
  );
};

export default AthloniaBandWidget;