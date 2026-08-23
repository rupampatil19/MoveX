import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Map, ScrollText, Activity, Users, Globe2,
  Trophy, Award, Bot, Store, CalendarDays, User, Settings,
  Medal, Flame, Zap, LogOut, Target, Gift, Castle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../Logo'; // Correct import path

const Sidebar = ({ user, logout, pro }) => {
  const location = useLocation();

  const beginnerNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/map', icon: Map, label: 'Map' },
    { to: '/quests', icon: Target, label: 'Quests' },
    { to: '/activity', icon: Activity, label: 'Activity' },
    { to: '/clan', icon: Users, label: 'Clan' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/rewards', icon: Gift, label: 'Rewards' },
    { to: '/ai-coach', icon: Bot, label: 'AI Coach' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const proNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/map', icon: Map, label: 'Map' },
    { to: '/quests', icon: Target, label: 'Quests' },
    { to: '/activity', icon: Activity, label: 'Activity' },
    { to: '/clan', icon: Users, label: 'Clan' },
    { to: '/state-hub', icon: Globe2, label: 'State Hub' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/rewards', icon: Award, label: 'Rewards' },
    { to: '/athlete', icon: Medal, label: 'Athlete' },
    { to: '/ai-coach', icon: Bot, label: 'AI Coach' },
    { to: '/store', icon: Store, label: 'Store' },
    { to: '/events', icon: CalendarDays, label: 'Events' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const navItems = user?.accountType === 'PRO' ? proNavItems : beginnerNavItems;

  const handleLogout = () => {
    if (window.confirm('Logout?\n\nAre you sure you want to logout from this account?')) {
      logout();
    }
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className={`hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col z-50 border-r ${
        pro ? 'bg-[#071426] border-[#2563EB]/25' : 'bg-white border-gray-200'
      }`}
    >
      <div className={`p-5 border-b ${pro ? 'border-[#2563EB]/20' : 'border-gray-100'}`}>
        <Logo pro={pro} light={!pro} />
        <p className={`text-xs mt-1 ${pro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
          {user.accountType === 'PRO' ? 'Pro Athlete' : 'Beginner'}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                pro
                  ? isActive
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#94A3B8] hover:bg-[#0D2138] hover:text-white'
                  : isActive
                    ? 'bg-[#2563EB] text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${pro && isActive ? 'text-white' : ''}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 border-t space-y-3 ${pro ? 'border-[#2563EB]/20' : 'border-gray-100'}`}>
        <Link to="/profile" className={`flex items-center gap-3 p-2 rounded-lg transition ${pro ? 'hover:bg-[#0D2138]' : 'hover:bg-gray-50'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${pro ? 'bg-[#2563EB]' : 'bg-[#2563EB]'}`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className={`text-sm font-semibold ${pro ? 'text-white' : 'text-gray-800'}`}>{user.name}</p>
            <p className={`text-xs ${pro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Level {user.level || 1}</p>
          </div>
        </Link>
        <div className={`w-full rounded-full h-2 ${pro ? 'bg-[#0D2138]' : 'bg-gray-100'}`}>
          <div
            className="h-2 rounded-full bg-[#2563EB]"
            style={{ width: `${Math.min(((user.xp || 0) / 1000) * 100, 100)}%` }}
          />
        </div>
        <p className={`text-xs ${pro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>{user.xp || 0} XP</p>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition ${
            pro
              ? 'text-[#94A3B8] hover:bg-[#0D2138] hover:text-white'
              : 'text-red-500 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;