import { Zap, Trophy, Flame, Bell, ChevronDown } from 'lucide-react';
import { useTrophy } from '../../context/TrophyContext';
import Logo from '../Logo';
import NotificationBell from '../NotificationBell';

const TopHeader = ({ user, pro }) => {
  const flowLabel = user?.accountType === 'PRO' ? 'Pro Athlete' : 'Beginner';
  const { balance, loading: trophyLoading } = useTrophy();

  return (
    <header className="sticky top-1 z-40 mx-3 md:mx-3 glass-strong rounded-2xl px-4 py-3 md:px-6 md:py-4 shadow-lg shadow-[#2563EB]/5 safe-top">
      {/* Mobile compact header */}
      <div className="flex md:hidden items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo pro={pro} size="sm" light={true} />
          <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-md shadow-[#2563EB]/30">
            {flowLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="text-sm text-gray-700">{user.name.split(' ')[0]}</div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Good Morning, {user.name} 👋
          </h1>
          <p className="text-sm text-gray-500">
            Your performance. Your progress. Your potential.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[#2563EB] glass-subtle rounded-full px-3 py-1.5 border border-white/60">
            <Zap className="w-4 h-4" />
            <span className="font-semibold text-gray-700 text-sm">{user.energy || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-[#2563EB] glass-subtle rounded-full px-3 py-1.5 border border-white/60">
            <Trophy className="w-4 h-4" />
            <span className="font-semibold text-gray-700 text-sm">
              {trophyLoading ? '…' : (balance ?? 0)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#2563EB] glass-subtle rounded-full px-3 py-1.5 border border-white/60">
            <Flame className="w-4 h-4" />
            <span className="font-semibold text-gray-700 text-sm">{user.streak || 0} Day</span>
          </div>
          <NotificationBell />
          <div className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl hover:bg-white/60 text-gray-700 transition-colors">
            <span className="text-sm">{user.region || 'Maharashtra'}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;