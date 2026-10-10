import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gift, Loader2 } from 'lucide-react';
import { getWinBackStatus, claimWelcomeKit } from '../../services/penaltyApi';
import Button from '../ui/Button';

/**
 * WinBackBanner — shown when a dormant user returns.
 * Displays Welcome Gift + claim button.
 * Hides once claimed.
 */
export default function WinBackBanner({ onClaimed }) {
  const [status, setStatus] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getWinBackStatus();
      if (alive) setStatus(s);
    })();
    return () => { alive = false; };
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await claimWelcomeKit();
      if (res.ok) {
        setClaimed(true);
        onClaimed?.(res.gift);
      } else {
        // Already claimed or not eligible — hide
        setClaimed(true);
      }
    } finally {
      setClaiming(false);
    }
  };

  // Only show if dormant + hasn't claimed
  if (!status?.isDormant || status?.winBackClaimed || claimed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl shadow-hero"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5] via-[#2563EB] to-[#1e3a8a]" />
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold mb-0.5">
              Welcome Back
            </p>
            <h2 className="text-lg sm:text-xl font-bold leading-tight">
              Everything is still here
            </h2>
            <p className="text-sm text-white/85 mt-1 max-w-lg">
              Your clan, level, trophies, streak — all preserved. Claim your Welcome Kit to restart with a boost.
            </p>

            {/* Gift preview */}
            <div className="grid grid-cols-4 gap-2 mt-4 max-w-sm">
              {[
                { icon: '⚡', label: '+100', sub: 'Energy' },
                { icon: '🏆', label: '+50', sub: 'Trophies' },
                { icon: '🧊', label: '+1', sub: 'Freeze' },
                { icon: '⭐', label: '2×', sub: '3 activities' },
              ].map((g) => (
                <div key={g.sub} className="text-center bg-white/10 rounded-xl py-2 border border-white/20">
                  <p className="text-lg leading-none">{g.icon}</p>
                  <p className="text-sm font-bold mt-1 leading-none">{g.label}</p>
                  <p className="text-[9px] text-white/70 mt-0.5 uppercase tracking-wider">{g.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="premium"
                icon={claiming ? Loader2 : Gift}
                loading={claiming}
                onClick={handleClaim}
                className="!bg-white !text-[#2563EB] hover:!bg-white/90"
              >
                Claim Welcome Kit
              </Button>
              <p className="text-xs text-white/70">
                Then 7 days of activity reopens the Bazaar
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}