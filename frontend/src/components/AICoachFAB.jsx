/**
 * AICoachFAB — floating button to open the AI Coach from anywhere in the app.
 * Hidden on the /ai-coach page itself and on auth pages (mounted from DashboardLayout).
 */
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

const AICoachFAB = () => {
  const location = useLocation();

  // Don't show on the AI Coach page itself
  if (location.pathname === '/ai-coach') return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.2 }}
      className="fixed z-[8000] bottom-24 right-4 md:bottom-6 md:right-6"
    >
      <Link
        to="/ai-coach"
        aria-label="Open AI Coach"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full
                   bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8]
                   shadow-lg shadow-[#2563EB]/40
                   hover:shadow-xl hover:shadow-[#2563EB]/50
                   ring-4 ring-white/60
                   transition-all duration-200
                   hover:scale-105 active:scale-95"
      >
        <Bot className="w-6 h-6 text-white" />

        {/* Pulse dot — small "online" hint */}
        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-mint-400 ring-2 ring-white" />

        {/* Desktop tooltip on hover */}
        <span className="hidden md:block absolute right-full mr-3 px-2.5 py-1 rounded-lg
                         bg-ink-900 text-white text-xs font-medium whitespace-nowrap
                         opacity-0 group-hover:opacity-100
                         pointer-events-none transition-opacity duration-150">
          AI Coach
        </span>
      </Link>
    </motion.div>
  );
};

export default AICoachFAB;