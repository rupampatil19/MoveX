import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ShieldCheck, Snowflake, ArrowRight, Clock,
  CheckCircle2, XCircle, TrendingUp, Sparkles
} from 'lucide-react';
import MoveXCard from '../components/ui/MoveXCard';
import MoveXGlassPanel from '../components/ui/MoveXGlassPanel';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Button from '../components/ui/Button';
import {
  getPenaltyState, getPenaltyHistory, getWinBackStatus, getBazaarStatus
} from '../services/penaltyApi';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDaysUntil(d) {
  if (!d) return null;
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Expiring';
  if (days === 1) return '1 day';
  return `${days} days`;
}

const TYPE_LABEL = {
  WARNING: 'Warning',
  STRIKE_1: 'First Strike',
  STRIKE_2: 'Second Strike',
  STRIKE_3: 'Third Strike',
  RESTRICTED: 'Restricted',
  WINBACK: 'Welcome Back',
};

const PenaltiesPage = () => {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(null);
  const [history, setHistory] = useState({ penalties: [], strikes: [] });
  const [winback, setWinback] = useState(null);
  const [bazaar, setBazaar] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, h, w, b] = await Promise.all([
          getPenaltyState(),
          getPenaltyHistory(),
          getWinBackStatus(),
          getBazaarStatus(),
        ]);
        setState(s);
        setHistory(h);
        setWinback(w);
        setBazaar(b);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 pb-28">
        <LoadingSkeleton variant="card" />
        <div className="grid grid-cols-2 gap-3">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
      </div>
    );
  }

  const strikeCount = state?.strikeCount || 0;
  const strikeLimit = state?.strikeLimit || 4;
  const freeze = state?.freeze || { available: 0, max: 3 };
  const effects = state?.effects || {};

  const strikeColor =
    strikeCount === 0 ? 'text-mint-600' :
    strikeCount === 1 ? 'text-amber-600' :
    strikeCount === 2 ? 'text-orange-600' :
    'text-red-600';

  const strikeBg =
    strikeCount === 0 ? 'bg-mint-500/10 border-mint-500/25' :
    strikeCount === 1 ? 'bg-amber-500/10 border-amber-500/25' :
    strikeCount === 2 ? 'bg-orange-500/10 border-orange-500/25' :
    'bg-red-500/10 border-red-500/25';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-28">
      {/* HERO */}
      <div className="relative hero-premium text-white rounded-hero p-5 sm:p-6 md:p-7">
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-on-gradient text-[10px] font-semibold uppercase tracking-widest mb-3">
            <ShieldCheck className="w-3 h-3" />
            Fair Play
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
            Your Standing
          </h1>
          <p className="text-sm md:text-base text-white/85 max-w-lg">
            {strikeCount === 0
              ? 'You\'re in good standing. Keep moving to stay protected.'
              : `${strikeCount} strike${strikeCount > 1 ? 's' : ''} active. One activity resets everything.`}
          </p>
        </div>
      </div>

      {/* STRIKE STATUS */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-2xl border ${strikeBg} p-4`}>
          <div className={`w-10 h-10 rounded-xl ${strikeBg} flex items-center justify-center mb-2`}>
            <AlertTriangle className={`w-5 h-5 ${strikeColor}`} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Active Strikes</p>
          <p className={`text-3xl font-bold ${strikeColor} mt-0.5 tabular-nums leading-none`}>
            {strikeCount}
            <span className="text-sm font-medium text-ink-400"> / {strikeLimit}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 p-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center mb-2">
            <Snowflake className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Streak Freezes</p>
          <p className="text-3xl font-bold text-sky-600 mt-0.5 tabular-nums leading-none">
            {freeze.available}
            <span className="text-sm font-medium text-ink-400"> / {freeze.max}</span>
          </p>
        </div>
      </div>

      {/* ACTIVE EFFECTS */}
      {(effects.energyMultiplier < 1 || effects.shieldRemoved || effects.chatLocked || effects.activityOnly) && (
        <MoveXCard variant="premium">
          <SectionHeader title="Active Effects" icon={TrendingUp} />
          <div className="space-y-2 mt-3">
            {effects.energyMultiplier < 1 && (
              <div className="flex items-center justify-between p-2.5 bg-amber-500/5 rounded-xl">
                <span className="text-sm text-ink-700">Energy generation</span>
                <span className="text-sm font-bold text-amber-600 tabular-nums">
                  {Math.round(effects.energyMultiplier * 100)}%
                </span>
              </div>
            )}
            {effects.shieldRemoved && (
              <div className="flex items-center justify-between p-2.5 bg-amber-500/5 rounded-xl">
                <span className="text-sm text-ink-700">Streak shield</span>
                <span className="text-sm font-bold text-amber-600">Removed</span>
              </div>
            )}
            {effects.chatLocked && (
              <div className="flex items-center justify-between p-2.5 bg-red-500/5 rounded-xl">
                <span className="text-sm text-ink-700">Clan chat</span>
                <span className="text-sm font-bold text-red-600">Locked</span>
              </div>
            )}
            {effects.activityOnly && (
              <div className="flex items-center justify-between p-2.5 bg-red-500/5 rounded-xl">
                <span className="text-sm text-ink-700">Account mode</span>
                <span className="text-sm font-bold text-red-600">Activity only</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-surface-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
            <p className="text-xs text-ink-600 flex-1">
              Log one activity to reset all penalties immediately.
            </p>
            <Link to="/start">
              <Button variant="primary" size="sm" iconRight={ArrowRight}>
                Start
              </Button>
            </Link>
          </div>
        </MoveXCard>
      )}

      {/* REWARDS GATE (only if active) */}
      {bazaar && !bazaar.unlocked && (
        <MoveXCard variant="premium">
          <SectionHeader title="MoveX Bazaar" icon={ShieldCheck} />
          <div className="mt-3">
            <p className="text-sm text-ink-700 mb-3">
              Complete <strong>{bazaar.target} consecutive active days</strong> to reopen the Bazaar.
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB]"
                  style={{ width: `${(bazaar.progress / bazaar.target) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[#2563EB] tabular-nums shrink-0">
                {bazaar.progress} / {bazaar.target}
              </span>
            </div>
            <p className="text-[11px] text-ink-500">
              Miss a day → counter resets. No penalty — just restart.
            </p>
          </div>
        </MoveXCard>
      )}

      {/* CURRENT PENALTIES */}
      {state?.penalties?.length > 0 && (
        <div>
          <SectionHeader title="Active Penalties" icon={AlertTriangle} />
          <div className="space-y-3">
            {state.penalties.map((p) => (
              <MoveXCard key={p._id} variant="bento" padded={false} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-ink-900">
                        {TYPE_LABEL[p.type] || p.type}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500 shrink-0">
                        {p.reason}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 mt-1">
                      Applied {fmtDate(p.appliedAt)}
                      {p.expiresAt && ` · Expires in ${fmtDaysUntil(p.expiresAt)}`}
                    </p>
                  </div>
                </div>
              </MoveXCard>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY */}
      {history.penalties.length > 0 && (
        <div>
          <SectionHeader title="History" icon={Clock} />
          <MoveXCard padded={false}>
            <ul className="divide-y divide-surface-100">
              {history.penalties.slice(0, 10).map((p) => (
                <li key={p._id} className="flex items-center justify-between p-4 first:pt-4 last:pb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {TYPE_LABEL[p.type] || p.type}
                    </p>
                    <p className="text-xs text-ink-500">{fmtDate(p.appliedAt)}</p>
                  </div>
                  {p.resolved ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint-600 shrink-0 ml-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 shrink-0 ml-2">
                      <Clock className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </MoveXCard>
        </div>
      )}

      {/* EMPTY STATE */}
      {(!state?.penalties || state.penalties.length === 0) && history.penalties.length === 0 && strikeCount === 0 && (
        <MoveXCard>
          <EmptyState
            icon={ShieldCheck}
            title="You're in perfect standing"
            message="No penalties, no strikes. Keep moving to stay protected. Streak freezes auto-earn every 7-day streak."
          />
        </MoveXCard>
      )}
    </motion.div>
  );
};

export default PenaltiesPage;