import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Mail, MapPin, Zap, Trophy, Flame, Activity,
  Route, Clock, Pencil, TrendingUp, Medal, Star, LogOut, ArrowRight
} from 'lucide-react';
import MoveXCard from '../components/ui/MoveXCard';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Button from '../components/ui/Button';
import { useTrophy } from '../context/TrophyContext';

const Profile = ({ user, logout }) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { balance: trophyBalance, loading: trophyLoading } = useTrophy();

  useEffect(() => {
    (async () => {
      try {
        const [userRes, actRes] = await Promise.all([
          API.get('/auth/me'),
          API.get('/activity/mine'),
        ]);
        setCurrentUser(userRes.data);
        setActivities(actRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    if (window.confirm('Logout?\n\nAre you sure you want to logout from this account?')) {
      logout();
    }
  };

  // Trophy: prefer TrophyContext, fall back to /auth/me value
  const displayTrophies = trophyLoading
    ? (currentUser?.trophyPoints ?? 0)
    : (trophyBalance ?? currentUser?.trophyPoints ?? 0);

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
  const xpIntoLevel = xp % xpForNextLevel;
  const xpProgress = Math.min((xpIntoLevel / xpForNextLevel) * 100, 100);
  const xpRemaining = xpForNextLevel - xpIntoLevel;

  const recentActivities = activities.slice(0, 5);

  const achievements = [
    { icon: Medal, title: 'First Workout', description: 'Complete your first activity', earned: totalWorkouts >= 1 },
    { icon: Flame, title: '7 Day Streak', description: 'Maintain a 7-day activity streak', earned: (currentUser?.streak || 0) >= 7 },
    { icon: Zap, title: 'Energy Booster', description: 'Earn 500+ energy', earned: (currentUser?.energy || 0) >= 500 },
    { icon: Route, title: '10 KM Runner', description: 'Run 10 km in total', earned: totalDistance >= 10 },
    { icon: Trophy, title: 'Consistency Champion', description: 'Complete 5 workouts', earned: totalWorkouts >= 5 },
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
    return `${diffDays}d ago`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5">

      {/* PROFILE HEADER */}
      <MoveXCard hero>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-[#2563EB]/30 shrink-0">
            {currentUser?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{currentUser?.name || 'Athlete'}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
              {currentUser?.email && (
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> {currentUser.email}
                </span>
              )}
              {currentUser?.region && (
                <span className="inline-flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {currentUser.region}
                </span>
              )}
            </div>
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            <Link to="/settings" className="flex-1 sm:flex-none">
              <Button variant="primary" size="sm" icon={Pencil} fullWidth>
                Edit
              </Button>
            </Link>
            <Button variant="secondary" size="sm" icon={LogOut} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </MoveXCard>

      {/* YOUR PROGRESS */}
      <MoveXCard>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Level</p>
            <p className="text-2xl font-bold text-gray-900">{level}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Total XP</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{xp.toLocaleString()}</p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] transition-all"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{xpIntoLevel} / {xpForNextLevel} XP</span>
          <span className="font-medium text-[#2563EB]">{xpRemaining} XP to Level {level + 1}</span>
        </div>
      </MoveXCard>

      {/* CORE STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MoveXCard padded={false} className="p-4">
          <Zap className="w-5 h-5 text-yellow-500 mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Energy</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{currentUser?.energy || 0}</p>
        </MoveXCard>
        <MoveXCard padded={false} className="p-4">
          <Trophy className="w-5 h-5 text-[#2563EB] mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Trophies</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{displayTrophies}</p>
        </MoveXCard>
        <MoveXCard padded={false} className="p-4">
          <Flame className="w-5 h-5 text-orange-500 mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Streak</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {currentUser?.streak || 0}<span className="text-xs text-gray-500 ml-0.5">d</span>
          </p>
        </MoveXCard>
        <MoveXCard padded={false} className="p-4">
          <Activity className="w-5 h-5 text-[#2563EB] mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Activities</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{totalWorkouts}</p>
        </MoveXCard>
      </div>

      {/* ACTIVITY SUMMARY */}
      <div>
        <SectionHeader title="Activity Summary" icon={TrendingUp} actionTo="/analytics" actionLabel="Analytics" />
        <div className="grid grid-cols-3 gap-3">
          <MoveXCard padded={false} className="p-4">
            <Route className="w-4 h-4 text-[#2563EB] mb-2" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Distance</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              {totalDistance.toFixed(1)}<span className="text-xs text-gray-500 ml-0.5">km</span>
            </p>
          </MoveXCard>
          <MoveXCard padded={false} className="p-4">
            <Clock className="w-4 h-4 text-[#2563EB] mb-2" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Duration</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{formatDuration(totalDuration)}</p>
          </MoveXCard>
          <MoveXCard padded={false} className="p-4">
            <Flame className="w-4 h-4 text-orange-500 mb-2" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Calories</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              {totalCalories.toFixed(0)}<span className="text-xs text-gray-500 ml-0.5">kcal</span>
            </p>
          </MoveXCard>
        </div>
      </div>

      {/* ACHIEVEMENTS + RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionHeader title="Achievements" icon={Medal} />
          <MoveXCard padded={false} className="p-4">
            <ul className="space-y-2">
              {achievements.map((ach, idx) => {
                const Icon = ach.icon;
                return (
                  <li
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      ach.earned ? 'bg-[#2563EB]/5' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      ach.earned ? 'bg-[#2563EB]/10' : 'bg-gray-200/60'
                    }`}>
                      <Icon className={`w-5 h-5 ${ach.earned ? 'text-[#2563EB]' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${ach.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                        {ach.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{ach.description}</p>
                    </div>
                    {ach.earned && <Star className="w-4 h-4 text-yellow-500 shrink-0" />}
                  </li>
                );
              })}
            </ul>
          </MoveXCard>
        </div>

        <div>
          <SectionHeader title="Recent Activity" icon={Activity} actionTo="/activity" actionLabel="View all" />
          <MoveXCard>
            {loading ? (
              <LoadingSkeleton variant="line" count={4} />
            ) : recentActivities.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Your MoveX story starts here"
                message="Log your first activity to see it here."
                action={
                  <Link to="/start">
                    <Button variant="primary" size="sm" icon={ArrowRight}>
                      Start Activity
                    </Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentActivities.map((act) => (
                  <li key={act._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-[#2563EB]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 capitalize truncate">{act.type}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {act.distance ? `${act.distance} km` : '—'}
                          {act.duration ? ` · ${act.duration} min` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{formatDate(act.date || act.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </MoveXCard>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;