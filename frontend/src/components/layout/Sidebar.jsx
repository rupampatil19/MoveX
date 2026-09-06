import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Map, ScrollText, Activity, Users, Globe2,
  Trophy, Award, Bot, Store, CalendarDays, User, Settings,
  Medal, Flame, Zap, LogOut, Target, Gift, Castle, Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../Logo';

const Sidebar = ({ user, logout }) => {
  const location = useLocation();
  const isPro = user?.accountType === 'PRO';

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
    { to: '/ar', icon: Camera, label: 'AR' },
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
    { to: '/analytics', icon: BarChart3, label: 'Analytics' }, // Analytics added
    { to: '/store', icon: Store, label: 'Store' },
    { to: '/events', icon: CalendarDays, label: 'Events' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const navItems = isPro ? proNavItems : beginnerNavItems;

  const handleLogout = () => {
    if (window.confirm('Logout?\n\nAre you sure you want to logout from this account?')) {
      logout();
    }
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white text-gray-800 flex-col z-50 border-r border-gray-200"
    >
      <div className="p-5 border-b border-gray-100">
        <Logo light={true} />
        <p className="text-xs mt-1 text-gray-500">
          {isPro ? 'Pro Athlete' : 'Beginner'}
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
                isActive
                  ? 'bg-[#2563EB] text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-3">
        <Link to="/profile" className="flex items-center gap-3 p-2 rounded-lg transition hover:bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">Level {user.level || 1}</p>
          </div>
        </Link>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-[#2563EB]"
            style={{ width: `${Math.min(((user.xp || 0) / 1000) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">{user.xp || 0} XP</p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;