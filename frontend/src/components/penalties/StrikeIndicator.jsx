import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldOff } from 'lucide-react';
import { getPenaltyState } from '../../services/penaltyApi';

/**
 * StrikeIndicator — small pill showing active strikes.
 * Renders nothing if user has 0 strikes.
 * Used in Profile header, TopHeader, Dashboard.
 */
export default function StrikeIndicator({ className = '', compact = false }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getPenaltyState();
      if (alive) setState(s);
    })();
    return () => { alive = false; };
  }, []);

  if (!state || !state.strikeCount || state.strikeCount === 0) return null;

  const count = state.strikeCount;

  if (compact) {
    return (
      <Link
        to="/penalties"
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 text-amber-700 text-[10px] font-bold border border-amber-500/30 hover:bg-amber-500/25 transition ${className}`}
        title={`${count} active strike${count > 1 ? 's' : ''}`}
      >
        <AlertTriangle className="w-3 h-3" />
        {count}
      </Link>
    );
  }

  return (
    <Link
      to="/penalties"
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 transition ${className}`}
    >
      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-900">
          {count} active strike{count > 1 ? 's' : ''}
        </p>
        <p className="text-[10px] text-amber-700/80">
          {count >= 3 ? 'Log activity to reset' : 'Improve your standing'}
        </p>
      </div>
    </Link>
  );
}