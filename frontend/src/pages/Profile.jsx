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
  const [currentUser, setCurrentUser] = useState(user);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
    fetchActivities();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get('/auth/me');
      setCurrentUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await API.get('/activity/mine');
      setActivities(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Logout?\n\nAre you sure you want to logout from this account?')) {
      logout();
    }
  };

  // Calculate totals from actual activities
  const totalWorkouts = activities.length;
  const totalDistance = activities.reduce((sum, act) => sum + (Number(act.distance) || 0), 0);
  const totalDuration = activities.reduce((sum, act) => sum + (Number(act.duration) || 0), 0);
  const totalCalories = activities.reduce((sum, act) => {
    const calPerKm = act.type === 'running' ? 60 : act.type === 'cycling' ? 30 : 45;
    return sum + (Number(act.distance) || 0) * calPerKm;
  }, 0);

  const xp = currentUser?.xp || 0;
  const level = currentUser?.level || 1;
  const xpForNextLevel = 1000;
  const xpProgress = Math.min((xp / xpForNextLevel) * 100, 100);

  const recentActivities = activities.slice(0, 5);

  const achievements = [
    { icon: Medal, title: 'First Workout', description: 'Complete your first activity', earned: totalWorkouts >= 1, color: 'text-[#2563EB]' },
    { icon: Flame, title: '7 Day Streak', description: 'Maintain a 7-day activity streak', earned: currentUser?.streak >= 7, color: 'text-orange-500' },
    { icon: Zap, title: 'Energy Booster', description: 'Earn 500+ energy', earned: currentUser?.energy >= 500, color: 'text-yellow-500' },
    { icon: Route, title: '10 KM Runner', description: 'Run 10 km in total', earned: totalDistance >= 10, color: 'text-blue-500' },
    { icon: Trophy, title: 'Consistency Champion', description: 'Complete 5 workouts', earned: totalWorkouts >= 5, color: 'text-purple-500' },
  ];

  const formatDuration = (min) => {
    const hrs = Math.floor(min / 60);
    const mins = Math.round(min % 60);
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
      {/* Logo always light on light background */}
      <Logo light={true} />

      {/* Profile Header Card - WHITE for all users */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[#2563EB] flex items-center justify-center text-4xl font-bold text-white">
            {currentUser?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">{currentUser?.name}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-gray-500">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {currentUser?.email}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {currentUser?.region || 'Not provided'}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[#2563EB] font-semibold">Level {level}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{xp} XP</span>
            </div>
            <div className="mt-3 max-w-md">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-[#2563EB] h-2 rounded-full" style={{ width: `${xpProgress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {xp} / {xpForNextLevel} XP • {xpForNextLevel - xp} XP to Level {level + 1}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/settings" className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-lg transition">
              <Pencil className="w-4 h-4" /> Edit Profile
            </Link>
            <Link to="/analytics" className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition">
              <TrendingUp className="w-4 h-4" /> View Analytics
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2 rounded-lg transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Key Stats - all white cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm text-gray-500">Energy</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{currentUser?.energy || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="text-sm text-gray-500">Trophies</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{currentUser?.trophies?.length || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm text-gray-500">Streak</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{currentUser?.streak || 0} Days</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#2563EB] mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-sm text-gray-500">Activities</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalWorkouts}</p>
        </div>
      </div>

      {/* Activity Summary - white cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#2563EB] mb-2">
            <Route className="w-5 h-5" />
            <span className="text-sm text-gray-500">Total Distance</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalDistance.toFixed(1)} km</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#2563EB] mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm text-gray-500">Total Duration</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatDuration(totalDuration)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm text-gray-500">Calories Burned</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalCalories.toFixed(0)} kcal</p>
        </div>
      </div>

      {/* Achievements + Recent Activity - white cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Achievements</h2>
          <ul className="space-y-3">
            {achievements.map((ach, idx) => {
              const Icon = ach.icon;
              return (
                <li key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${ach.earned ? 'bg-blue-50' : 'bg-gray-50 opacity-60'}`}>
                  <Icon className={`w-6 h-6 ${ach.color}`} />
                  <div>
                    <p className="text-gray-800 font-semibold">{ach.title}</p>
                    <p className="text-sm text-gray-500">{ach.description}</p>
                  </div>
                  {ach.earned && <Star className="w-5 h-5 text-yellow-500 ml-auto" />}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          {loading ? <p className="text-gray-500">Loading...</p> : recentActivities.length === 0 ? <p className="text-gray-500">No activities yet.</p> : (
            <ul className="space-y-2">
              {recentActivities.map((act) => (
                <li key={act._id} className="flex items-center justify-between border-b border-gray-100 py-2">
                  <div>
                    <p className="text-gray-800 capitalize">{act.type}</p>
                    <p className="text-sm text-gray-500">{act.distance} km • {act.duration} min</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(act.date)}</span>
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