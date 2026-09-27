import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Mail, MapPin, Zap, Trophy, Flame, Activity,
  Route, Clock, Pencil, TrendingUp, Medal, Star, LogOut, ArrowRight
} from 'lucide-react';
import MoveXCard from '../components/ui/MoveXCard';
import MoveXGlassPanel from '../components/ui/MoveXGlassPanel';
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

  const displayTrophies = trophyLoading
    ? (currentUser?.trophyPoints ?? 0)
    : (trophyBalance ?? currentUser?.trophyPoints ?? 0);

  const totalWorkouts = activities.length;
  const totalDistance = activities.reduce((s, a) => s + (Number(a.distance) || 0), 0);
  const totalDuration = activities.reduce((s, a) => s + (Number(a.duration) || 0), 0);
  const totalCalories = activities.reduce((s, a) => {
    const calPerKm = a.type === 'running' ? 60 : a.type === 'cycling' ? 30 : 45;
    return s + (Number(a.distance) || 0) * calPerKm;
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-28">

      {/* ============ IDENTITY HEADER ============ */}
      <MoveXCard variant="premium">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-20 h-20 rounded-panel bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-3xl font-bold text-white shadow-hero ring-4 ring-white/60 shrink-0">
            {currentUser?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-ink-900 truncate">
              {currentUser?.name || 'Athlete'}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-ink-500">
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
              <Button variant="premium" size="sm" icon={Pencil} fullWidth>Edit</Button>
            </Link>
            <Button variant="secondary" size="sm" icon={LogOut} onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </MoveXCard>

      {/* ============ PROGRESS PANEL — Spatial + Liquid Glass ============ */}
      <div className="relative overflow-hidden rounded-panel bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1e40af] shadow-hero">
        {/* Decorative depth blobs */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative p-5 sm:p-6">
          {/* Top row: Level badge on left, XP on right */}
          <div className="flex items-start justify-between gap-4 mb-5">
            {/* Level badge */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex flex-col items-center justify-center shrink-0">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 leading-none">
                  Lvl
                </span>
                <span className="text-xl font-bold text-white leading-none mt-0.5 tabular-nums">
                  {level}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                  Current Rank
                </p>
                <p className="text-base font-bold text-white mt-0.5">
                  Level {level}
                </p>
              </div>
            </div>

            {/* XP block */}
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                Total XP
              </p>
              <p className="text-2xl font-bold text-white tabular-nums leading-none mt-1">
                {xp.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress bar with glass track */}
          <div className="mb-2.5">
            <div className="w-full bg-white/15 backdrop-blur-sm rounded-full h-2.5 overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white to-blue-50 shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all duration-500"
                style={{ width: `${Math.max(xpProgress, 2)}%` }}
              />
            </div>
          </div>

          {/* Bottom row: progress numbers */}
          <div className="flex items-center justify-between text-[11px] text-white/85">
            <span className="tabular-nums">
              {xpIntoLevel} / {xpForNextLevel} XP
            </span>
            <span className="font-semibold tabular-nums">
              {xpRemaining} XP to Level {level + 1}
            </span>
          </div>
        </div>
      </div>

      {/* ============ BENTO STATS ============ */}
      <div>
        <SectionHeader title="Core Stats" icon={TrendingUp} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center mb-2">
              <Zap className="w-4 h-4 text-gold-500" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Energy</p>
            <p className="text-2xl font-bold text-ink-900 mt-0.5 tabular-nums">
              {(currentUser?.energy || 0).toLocaleString()}
            </p>
          </MoveXCard>
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center mb-2">
              <Trophy className="w-4 h-4 text-[#2563EB]" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Trophies</p>
            <p className="text-2xl font-bold text-ink-900 mt-0.5 tabular-nums">{displayTrophies}</p>
          </MoveXCard>
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <div className="w-8 h-8 rounded-lg bg-ember-500/10 flex items-center justify-center mb-2">
              <Flame className="w-4 h-4 text-ember-500" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Streak</p>
            <p className="text-2xl font-bold text-ink-900 mt-0.5 tabular-nums">
              {currentUser?.streak || 0}<span className="text-xs font-medium text-ink-500 ml-0.5">d</span>
            </p>
          </MoveXCard>
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <div className="w-8 h-8 rounded-lg bg-mint-500/10 flex items-center justify-center mb-2">
              <Activity className="w-4 h-4 text-mint-500" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Activities</p>
            <p className="text-2xl font-bold text-ink-900 mt-0.5 tabular-nums">{totalWorkouts}</p>
          </MoveXCard>
        </div>
      </div>

      {/* ============ ACTIVITY SUMMARY ============ */}
      <div>
        <SectionHeader title="Activity Summary" icon={TrendingUp} actionTo="/analytics" actionLabel="Analytics" />
        <div className="grid grid-cols-3 gap-3">
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <Route className="w-4 h-4 text-[#2563EB] mb-2" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Distance</p>
            <p className="text-base sm:text-lg font-bold text-ink-900 mt-0.5 tabular-nums">
              {totalDistance.toFixed(1)}<span className="text-xs text-ink-500 ml-0.5">km</span>
            </p>
          </MoveXCard>
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <Clock className="w-4 h-4 text-[#2563EB] mb-2" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Duration</p>
            <p className="text-base sm:text-lg font-bold text-ink-900 mt-0.5">{formatDuration(totalDuration)}</p>
          </MoveXCard>
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <Flame className="w-4 h-4 text-ember-500 mb-2" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Calories</p>
            <p className="text-base sm:text-lg font-bold text-ink-900 mt-0.5 tabular-nums">
              {Math.round(totalCalories)}<span className="text-xs text-ink-500 ml-0.5">kcal</span>
            </p>
          </MoveXCard>
        </div>
      </div>

      {/* ============ ACHIEVEMENTS + RECENT ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionHeader title="Achievements" icon={Medal} />
          <MoveXCard>
            <ul className="space-y-2">
              {achievements.map((ach, idx) => {
                const Icon = ach.icon;
                return (
                  <li
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                      ach.earned ? 'bg-[#2563EB]/5' : 'bg-surface-50 opacity-70'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      ach.earned ? 'icon-tile-soft-blue border border-white/60' : 'bg-surface-200'
                    }`}>
                      <Icon className={`w-4 h-4 ${ach.earned ? 'text-[#2563EB]' : 'text-ink-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${ach.earned ? 'text-ink-900' : 'text-ink-500'}`}>
                        {ach.title}
                      </p>
                      <p className="text-xs text-ink-500 truncate">{ach.description}</p>
                    </div>
                    {ach.earned && <Star className="w-4 h-4 text-gold-500 shrink-0" />}
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
                    <Button variant="primary" size="sm" icon={ArrowRight}>Start Activity</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-surface-100">
                {recentActivities.map((act) => (
                  <li key={act._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-[#2563EB]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900 capitalize truncate">{act.type}</p>
                        <p className="text-xs text-ink-500 truncate">
                          {act.distance ? `${Number(act.distance).toFixed(2)} km` : '—'}
                          {act.duration ? ` · ${Math.round(act.duration)} min` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-ink-400 shrink-0 ml-2">{formatDate(act.date || act.createdAt)}</span>
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