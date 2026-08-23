import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  User, Mail, MapPin, Zap, Trophy, Flame, Activity,
  Route, Clock, Pencil, TrendingUp,
  Medal, Award, Star, Calendar, LogOut
} from 'lucide-react';
import Logo from '../components/Logo';

const Profile = ({ user, logout }) => {
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await API.get('/activity/mine');
      setActivities(res.data);
      setLoadingActivities(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load activities');
      setLoadingActivities(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Logout?\n\nAre you sure you want to logout from this account?')) {
      logout();
    }
  };

  const isPro = user.accountType === 'PRO';

  const totalWorkouts = activities.length;
  const totalDistance = activities.reduce((sum, act) => sum + act.distance, 0);
  const totalDuration = activities.reduce((sum, act) => sum + act.duration, 0);
  const totalCalories = activities.reduce((sum, act) => {
    const calPerKm = act.type === 'running' ? 60 : act.type === 'cycling' ? 30 : 45;
    return sum + act.distance * calPerKm;
  }, 0);

  const xp = user.xp || 0;
  const level = user.level || 1;
  const xpForNextLevel = 1000;
  const xpProgress = Math.min((xp / xpForNextLevel) * 100, 100);

  const recentActivities = activities.slice(0, 5);

  const achievements = [
    { icon: Medal, title: 'First Workout', description: 'Complete your first activity', earned: totalWorkouts >= 1, color: 'text-[#2563EB]' },
    { icon: Flame, title: '7 Day Streak', description: 'Maintain a 7-day activity streak', earned: user.streak >= 7, color: 'text-orange-500' },
    { icon: Zap, title: 'Energy Booster', description: 'Earn 500+ energy', earned: xp >= 500, color: 'text-yellow-500' },
    { icon: Route, title: '10 KM Runner', description: 'Run 10 km in total', earned: totalDistance >= 10, color: 'text-blue-500' },
    { icon: Trophy, title: 'Consistency Champion', description: 'Complete 5 workouts', earned: totalWorkouts >= 5, color: 'text-purple-500' },
  ];

  const formatDuration = (min) => {
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Logo pro={isPro} light={!isPro} />

      <div className={`rounded-2xl p-6 border shadow-sm ${isPro ? 'bg-[#0D2138] border-[#2563EB]/25' : 'bg-white border-gray-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[#2563EB] flex items-center justify-center text-4xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className={`text-3xl font-bold ${isPro ? 'text-white' : 'text-gray-800'}`}>{user.name}</h1>
            <div className={`flex flex-wrap gap-4 mt-2 ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {user.region || 'Not provided'}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[#2563EB] font-semibold">Level {level}</span>
              <span className={isPro ? 'text-[#94A3B8]' : 'text-gray-400'}>•</span>
              <span className={isPro ? 'text-white' : 'text-gray-600'}>{xp} XP</span>
            </div>
            <div className="mt-3 max-w-md">
              <div className={`w-full rounded-full h-2 ${isPro ? 'bg-[#071426]' : 'bg-gray-100'}`}>
                <div className="bg-[#2563EB] h-2 rounded-full" style={{ width: `${xpProgress}%` }} />
              </div>
              <p className={`text-xs mt-1 ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>{xp} / {xpForNextLevel} XP • {xpForNextLevel - xp} XP to Level {level + 1}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/settings" className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-lg transition"><Pencil className="w-4 h-4" /> Edit Profile</Link>
            <Link to="/analytics" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isPro ? 'bg-[#071426] text-white hover:bg-[#0D2138]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><TrendingUp className="w-4 h-4" /> View Analytics</Link>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2 rounded-lg transition"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        </div>
      </div>

      {/* Fitness Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-2xl p-4 border shadow-sm ${isPro ? 'bg-[#0D2138] border-[#2563EB]/25' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 text-yellow-500 mb-2"><Zap className="w-5 h-5" /><span className={`text-sm ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Energy</span></div>
          <p className={`text-2xl font-bold ${isPro ? 'text-white' : 'text-gray-800'}`}>{user.energy || 0}</p>
        </div>
        <div className={`rounded-2xl p-4 border shadow-sm ${isPro ? 'bg-[#0D2138] border-[#2563EB]/25' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 text-purple-500 mb-2"><Trophy className="w-5 h-5" /><span className={`text-sm ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Trophies</span></div>
          <p className={`text-2xl font-bold ${isPro ? 'text-white' : 'text-gray-800'}`}>{user.trophies?.length || 0}</p>
        </div>
        <div className={`rounded-2xl p-4 border shadow-sm ${isPro ? 'bg-[#0D2138] border-[#2563EB]/25' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 text-orange-500 mb-2"><Flame className="w-5 h-5" /><span className={`text-sm ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Streak</span></div>
          <p className={`text-2xl font-bold ${isPro ? 'text-white' : 'text-gray-800'}`}>{user.streak || 0} Days</p>
        </div>
        <div className={`rounded-2xl p-4 border shadow-sm ${isPro ? 'bg-[#0D2138] border-[#2563EB]/25' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Activity className="w-5 h-5" /><span className={`text-sm ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Activities</span></div>
          <p className={`text-2xl font-bold ${isPro ? 'text-white' : 'text-gray-800'}`}>{totalWorkouts}</p>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-2xl p-4 border shadow-sm ${isPro ? 'bg-[#0D2138] border-[#2563EB]/25' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Route className="w-5 h-5" /><span className={`text-sm ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Total Distance</span></div>
          <p className={`text-2xl font-bold ${isPro ? 'text-white' : 'text-gray-800'}`}>{totalDistance.toFixed(1)} km</p>
        </div>
        <div className={`rounded-2xl p-4 border shadow-sm ${isPro ? 'bg-[#0D2138] border-[#2563EB]/25' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Clock className="w-5 h-5" /><span className={`text-sm ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Total Duration</span></div>
          <p className={`text-2xl font-bold ${isPro ? 'text-white' : 'text-gray-800'}`}>{formatDuration(totalDuration)}</p>
        </div>
        <div className={`rounded-2xl p-4 border shadow-sm ${isPro ? 'bg-[#0D2138] border-[#2563EB]/25' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 text-red-400 mb-2"><Flame className="w-5 h-5" /><span className={`text-sm ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Calories Burned</span></div>
          <p className={`text-2xl font-bold ${isPro ? 'text-white' : 'text-gray-800'}`}>{totalCalories.toFixed(0)} kcal</p>
        </div>
      </div>

      {/* Achievements + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border shadow-sm ${isPro ? 'bg-[#0D2138] border-[#2563EB]/25' : 'bg-white border-gray-100'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isPro ? 'text-white' : 'text-gray-800'}`}>Achievements</h2>
          <ul className="space-y-3">
            {achievements.map((ach, idx) => {
              const Icon = ach.icon;
              return (
                <li key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${ach.earned ? (isPro ? 'bg-[#071426]' : 'bg-blue-50') : (isPro ? 'bg-[#071426]/50' : 'bg-gray-50 opacity-60')}`}>
                  <Icon className={`w-6 h-6 ${ach.color}`} />
                  <div>
                    <p className={`font-semibold ${isPro ? 'text-white' : 'text-gray-800'}`}>{ach.title}</p>
                    <p className={`text-sm ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>{ach.description}</p>
                  </div>
                  {ach.earned && <Star className="w-5 h-5 text-yellow-500 ml-auto" />}
                </li>
              );
            })}
          </ul>
        </div>
        <div className={`rounded-2xl p-6 border shadow-sm ${isPro ? 'bg-[#0D2138] border-[#2563EB]/25' : 'bg-white border-gray-100'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isPro ? 'text-white' : 'text-gray-800'}`}>Recent Activity</h2>
          {loadingActivities ? <p className={isPro ? 'text-[#94A3B8]' : 'text-gray-500'}>Loading...</p> : error ? <p className="text-red-500">{error}</p> : recentActivities.length === 0 ? <p className={isPro ? 'text-[#94A3B8]' : 'text-gray-500'}>No activities yet.</p> : (
            <ul className="space-y-2">
              {recentActivities.map((act) => (
                <li key={act._id} className={`flex items-center justify-between border-b py-2 ${isPro ? 'border-[#2563EB]/20' : 'border-gray-100'}`}>
                  <div>
                    <p className={`capitalize ${isPro ? 'text-white' : 'text-gray-800'}`}>{act.type}</p>
                    <p className={`text-sm ${isPro ? 'text-[#94A3B8]' : 'text-gray-500'}`}>{act.distance} km • {act.duration} min</p>
                  </div>
                  <span className={`text-xs ${isPro ? 'text-[#94A3B8]' : 'text-gray-400'}`}>{formatDate(act.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;