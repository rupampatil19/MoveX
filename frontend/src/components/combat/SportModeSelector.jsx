/**
 * SportModeSelector.jsx
 * Segmented control that sends B / M / T to the APEX band.
 * Supports `variant="light"` (default, for MoveX cards) and `variant="dark"` (for overlay contexts).
 * Persists selection to localStorage under `apex.sportMode`.
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, WifiOff } from 'lucide-react';
import { getAthloniaBandService } from '../../services/athloniaBandService';

const STORAGE_KEY = 'apex.sportMode';

const SPORTS = [
  { id: 'boxing',   label: 'Boxing',    emoji: '\u{1F94A}' },
  { id: 'mma',      label: 'MMA',       emoji: '\u{1F93C}' },
  { id: 'muaythai', label: 'Muay Thai', emoji: '\u{1F9B5}' },
];

export default function SportModeSelector({ onChange, value, variant = 'light', className = '' }) {
  const dark = variant === 'dark';

  const [selected, setSelected] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || value || 'boxing'; }
    catch { return value || 'boxing'; }
  });
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [bandConnected, setBandConnected] = useState(false);

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

  useEffect(() => {
    if (!bandConnected) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const band = getAthloniaBandService();
        if (band && typeof band.setSportMode === 'function') {
          await band.setSportMode(selected);
          if (!cancelled) {
            setSynced(true);
            setTimeout(() => { if (!cancelled) setSynced(false); }, 1500);
          }
        }
      } catch (err) {
        console.warn('[SportModeSelector] sync failed:', err.message);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bandConnected, selected]);

  const handleSelect = useCallback(async (sportId) => {
    if (sportId === selected) return;
    setSelected(sportId);
    try { localStorage.setItem(STORAGE_KEY, sportId); } catch {}
    if (typeof onChange === 'function') onChange(sportId);

    const band = getAthloniaBandService();
    if (!band || !band.connected) return;

    setSyncing(true);
    try {
      if (typeof band.setSportMode === 'function') {
        await band.setSportMode(sportId);
        setSynced(true);
        setTimeout(() => setSynced(false), 1500);
      }
    } catch (err) {
      console.warn('[SportModeSelector] set failed:', err.message);
    } finally {
      setSyncing(false);
    }
  }, [selected, onChange]);

  // ===== Light variant classes (default — matches MoveX) =====
  const labelCls   = dark ? 'text-white/50' : 'text-ink-500';
  const idleBtn    = dark
    ? 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
    : 'bg-white text-ink-700 border border-surface-200 hover:border-surface-300 hover:shadow-sm';
  const activeBtn  = dark
    ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30'
    : 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/25';
  const statusIdle = dark ? 'text-white/40' : 'text-ink-400';
  const statusWarn = dark ? 'text-amber-400' : 'text-amber-600';
  const statusOk   = dark ? 'text-mint-400' : 'text-mint-600';
  const hintCls    = dark ? 'text-white/40' : 'text-ink-400';

  return (
    <div className={'space-y-2.5 ' + className}>
      <div className="flex items-center justify-between">
        <p className={'text-xs font-bold uppercase tracking-widest ' + labelCls}>
          Sport Mode
        </p>
        <span className="text-[10px] font-semibold flex items-center gap-1">
          {!bandConnected && (
            <span className={statusWarn + ' inline-flex items-center gap-1'}>
              <WifiOff className="w-3 h-3" /> band offline
            </span>
          )}
          {bandConnected && syncing && (
            <span className={statusIdle + ' inline-flex items-center gap-1'}>
              <Loader2 className="w-3 h-3 animate-spin" /> syncing
            </span>
          )}
          {bandConnected && synced && (
            <span className={statusOk + ' inline-flex items-center gap-1'}>
              <Check className="w-3 h-3" /> sent to band
            </span>
          )}
          {bandConnected && !syncing && !synced && (
            <span className={statusIdle}>ready</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {SPORTS.map((s) => {
          const active = selected === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.id)}
              disabled={syncing}
              className={
                'rounded-card p-3.5 flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.98] ' +
                (active ? activeBtn : idleBtn)
              }
            >
              <span className="text-2xl leading-none">{s.emoji}</span>
              <span className="text-xs font-semibold">{s.label}</span>
            </button>
          );
        })}
      </div>

      {!bandConnected && (
        <p className={'text-[11px] leading-relaxed ' + hintCls}>
          Connect your APEX band to auto-apply this mode on the device.
        </p>
      )}
    </div>
  );
}