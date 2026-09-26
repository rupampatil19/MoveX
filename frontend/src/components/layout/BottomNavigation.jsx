import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Map, PlusCircle, Users, User, Menu, X,
  BarChart3, ScrollText, Activity, Globe2, Trophy, Award,
  Medal, Bot, Store, CalendarDays, Settings, LogOut, Camera
} from 'lucide-react';

const primaryItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/start', icon: PlusCircle, label: 'Start', center: true },
  { to: '/clan', icon: Users, label: 'Clan' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const BottomNavigation = ({ user, logout }) => {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isPro = user?.accountType === 'PRO';

  const commonMoreItems = [
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/quests', icon: ScrollText, label: 'Quests' },
    { to: '/activity', icon: Activity, label: 'Activity' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/rewards', icon: Award, label: 'Rewards' },
    { to: '/ai-coach', icon: Bot, label: 'AI Coach' },
    { to: '/ar', icon: Camera, label: 'AR' },
    { to: '/events', icon: CalendarDays, label: 'Events' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const proOnlyItems = [
    { to: '/state-hub', icon: Globe2, label: 'State Hub' },
    { to: '/athlete', icon: Medal, label: 'Athlete' },
    { to: '/store', icon: Store, label: 'Store' },
  ];

  const moreItems = isPro ? [...commonMoreItems, ...proOnlyItems] : commonMoreItems;

  const handleLogout = () => {
    if (window.confirm('Logout?\n\nAre you sure you want to logout from this account?')) {
      setIsMoreOpen(false);
      logout();
    }
  };

  return (
    <>
      {/* Floating pill nav */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 glass-strong rounded-2xl border border-white/50 z-40 flex justify-around items-center px-2 py-2 shadow-2xl shadow-[#2563EB]/15">
        {primaryItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          if (item.center) {
            return (
              <Link key={item.to} to={item.to} className="flex flex-col items-center -mt-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center shadow-lg shadow-[#2563EB]/40 border-4 border-white/70">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-gray-700 mt-0.5 font-medium">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center px-2 py-1 rounded-xl transition-colors ${
                isActive ? 'text-[#2563EB]' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center px-2 py-1 rounded-xl transition-colors ${
            isMoreOpen ? 'text-[#2563EB]' : 'text-gray-500'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>

      {isMoreOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[90] md:hidden"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="fixed bottom-3 left-3 right-3 glass-strong rounded-3xl border border-white/50 z-[100] md:hidden max-h-[80vh] flex flex-col shadow-2xl shadow-[#2563EB]/15">
            <div className="flex items-center justify-between p-4 border-b border-white/50">
              <h2 className="text-lg font-semibold text-gray-800">More</h2>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-2 rounded-full hover:bg-white/60 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 text-gray-700 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-[#2563EB]" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50/70 text-red-500 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
            <div className="p-3 border-t border-white/50">
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-full py-3 glass-subtle hover:bg-white/70 text-gray-700 rounded-xl text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BottomNavigation;