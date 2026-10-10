/**
 * CombatQuickAction.jsx
 * Pro-only hero card that opens the Combat Training screen.
 */
import { Link } from 'react-router-dom';
import { Swords, ArrowRight, Activity, Heart } from 'lucide-react';

const CombatQuickAction = () => {
  return (
    <Link
      to="/combat"
      className="block relative overflow-hidden rounded-hero p-5 sm:p-6 text-white shadow-hero active:scale-[0.99] transition"
      style={{ background: 'linear-gradient(135deg, #7C2D12 0%, #B91C1C 55%, #991B1B 100%)' }}
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/25 text-[9px] font-bold uppercase tracking-widest">
              Pro Only
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 text-[9px] font-bold uppercase tracking-widest">
              <Activity className="w-2.5 h-2.5" />
              Live
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-1.5">
            Combat Training
          </h2>
          <p className="text-sm text-white/85 leading-relaxed">
            Boxing · MMA · Muay Thai
          </p>

          <div className="flex items-center gap-3 mt-3 text-[11px] text-white/75">
            <span className="inline-flex items-center gap-1">
              <Swords className="w-3.5 h-3.5" />
              Strike counting
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              HR zones
            </span>
          </div>
        </div>

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30">
          <Swords className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
      </div>

      <div className="relative mt-4 inline-flex items-center gap-1.5 bg-white text-[#991B1B] font-semibold px-3.5 py-2 rounded-full text-xs shadow-lg shadow-black/20">
        Start Session
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
};

export default CombatQuickAction;
