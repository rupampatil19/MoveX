import { Zap, Trophy, Flame, Bell, ChevronDown } from 'lucide-react';
import Logo from '../Logo';

const TopHeader = ({ user, pro }) => {
  const flowLabel = user?.accountType === 'PRO' ? 'Pro Athlete' : 'Beginner';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
      {/* Mobile compact header */}
      <div className="flex md:hidden items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo pro={pro} size="sm" light={true} />
          <span className={`text-xs px-2 py-1 rounded-full ${pro ? 'bg-[#2563EB] text-white' : 'bg-[#2563EB] text-white'}`}>
            {flowLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="text-sm text-gray-700">
            {user.name.split(' ')[0]}
          </div>
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#2563EB]">
            <Zap className="w-5 h-5" />
            <span className="font-semibold text-gray-700">{user.energy || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-[#2563EB]">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold text-gray-700">{user.trophies?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-[#2563EB]">
            <Flame className="w-5 h-5" />
            <span className="font-semibold text-gray-700">{user.streak || 0} Day</span>
          </div>
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-2 cursor-pointer px-3 py-1 rounded-lg hover:bg-gray-100 text-gray-700">
            <span className="text-sm">{user.region || 'Maharashtra'}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;