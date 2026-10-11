/**
 * ARQuickAction.jsx
 * Pro-only hero card that opens the AR Training picker.
 */
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Camera, Boxes } from 'lucide-react';

const ARQuickAction = () => {
  return (
    <Link
      to="/ar"
      className="block relative overflow-hidden rounded-hero p-5 sm:p-6 text-white shadow-hero active:scale-[0.99] transition"
      style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 45%, #5B21B6 100%)' }}
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
              <Sparkles className="w-2.5 h-2.5" />
              Live
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-1.5">
            AR Training
          </h2>
          <p className="text-sm text-white/85 leading-relaxed">
            3D trainer on your floor. Real-time form coaching.
          </p>

          <div className="flex items-center gap-3 mt-3 text-[11px] text-white/75">
            <span className="inline-flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5" />
              5 exercises
            </span>
            <span className="inline-flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              Pose detection
            </span>
          </div>
        </div>

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30">
          <Boxes className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
      </div>

      <div className="relative mt-4 inline-flex items-center gap-1.5 bg-white text-[#5B21B6] font-semibold px-3.5 py-2 rounded-full text-xs shadow-lg shadow-black/20">
        Start AR Session
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
};

export default ARQuickAction;
