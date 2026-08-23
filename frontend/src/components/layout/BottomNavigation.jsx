import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Map, PlusCircle, Users, User, Menu, X,
  BarChart3, ScrollText, Activity, Globe2, Trophy, Award,
  Medal, Bot, Store, CalendarDays, Settings, LogOut
} from 'lucide-react';

const primaryItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/start', icon: PlusCircle, label: 'Start', center: true },
  { to: '/clan', icon: Users, label: 'Clan' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const moreItems = [
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/quests', icon: ScrollText, label: 'Quests' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/state-hub', icon: Globe2, label: 'State Hub' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/rewards', icon: Award, label: 'Rewards' },
  { to: '/athlete', icon: Medal, label: 'Athlete' },
  { to: '/ai-coach', icon: Bot, label: 'AI Coach' },
  { to: '/store', icon: Store, label: 'Store' },
  { to: '/events', icon: CalendarDays, label: 'Events' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const BottomNavigation = ({ logout }) => {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Logout?\n\nAre you sure you want to logout from this account?')) {
      setIsMoreOpen(false);
      logout();
    }
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex justify-around items-center px-2 py-2">
        {primaryItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          if (item.center) {
            return (
              <Link key={item.to} to={item.to} className="flex flex-col items-center -mt-6">
                <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs text-gray-700 mt-1">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center px-3 py-1 rounded-lg ${
                isActive ? 'text-blue-700' : 'text-gray-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center px-3 py-1 rounded-lg ${
            isMoreOpen ? 'text-blue-700' : 'text-gray-500'
          }`}
        >
          <Menu className="w-6 h-6" />
          <span className="text-xs mt-1">More</span>
        </button>
      </nav>

      {isMoreOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[90] md:hidden"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-2xl z-[100] md:hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">More</h2>
              <button onClick={() => setIsMoreOpen(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
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
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700"
                  >
                    <Icon className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 text-red-500"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
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