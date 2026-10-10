import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Flame, Trophy, Zap, Activity,
  ChevronRight, ArrowRight, TrendingUp, Gauge
} from 'lucide-react';
import MoveXCard from '../components/ui/MoveXCard';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import { useTrophy } from '../context/TrophyContext';
import FriendlyNudge from '../components/penalties/FriendlyNudge';
import WinBackBanner from '../components/penalties/WinBackBanner';
import AthloniaBandWidget from '../components/band/AthloniaBandWidget';
import CombatQuickAction from '../components/combat/CombatQuickAction';

const ProDashboard = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [currentUser, setCurrentUser] = useState(user);

  const { balance: trophyBalance, loading: trophyLoading } = useTrophy();

  useEffect(() => {
    fetchUser();
    fetchData();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get('/auth/me');
      setCurrentUser(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchData = async () => {
    try {
      const activityRes = await API.get('/activity/mine');
      setActivities(activityRes.data || []);
    } catch (err) { console.error(err); }
  };

  const displayTrophies = trophyLoading
    ? (currentUser?.trophyPoints ?? 0)
    : (trophyBalance ?? currentUser?.trophyPoints ?? 0);

  const weekAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);
  const thisWeek = useMemo(
    () => activities.filter((a) => new Date(a.date || a.createdAt) > weekAgo),
    [activities, weekAgo]
  );
  const weeklyDistance = useMemo(
    () => thisWeek.reduce((s, a) => s + (Number(a.distance) || 0), 0),
    [thisWeek]
  );
  const weekEnergy = useMemo(
    () => thisWeek.reduce((s, a) => s + (Number(a.energyAwarded) || 0), 0),
    [thisWeek]
  );

  const avgAVS = useMemo(() => {
    const verified = activities.filter((a) => a.verification?.avs);
    if (!verified.length) return null;
    return Math.round(verified.reduce((s, a) => s + (a.verification.avs || 0), 0) / verified.length);
  }, [activities]);

  const xpForNextLevel = 1000;
  const xpProgress = Math.min(((currentUser?.xp || 0) % xpForNextLevel) / xpForNextLevel * 100, 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5">
      <WinBackBanner />
      <FriendlyNudge />

      {/* ATHLONIA BAND */}
      <AthloniaBandWidget />

      {/* COMBAT TRAINING (Pro) */}
      <CombatQuickAction />

      {/* HERO */}
      <div className="relative hero-premium text-white rounded-hero p-5 sm:p-6 md:p-7">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
              Elite Performance Center
            </h1>
            <p className="text-sm md:text-base text-white/85 max-w-lg">
              Your performance, progress, and potential.
            </p>
          </div>
          <Link
            to="/start"
            className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition text-sm shadow-lg shadow-black/10 self-start sm:self-auto shrink-0"
          >
            Start Activity <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ATHLETE SNAPSHOT - 4 equal KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
          <div className="w-8 h-8 rounded-lg icon-tile-ember flex items-center justify-center mb-3">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Streak</p>
          <p className="text-2xl font-bold text-ink-900 leading-tight mt-0.5 tabular-nums">
            {currentUser?.streak || 0}<span className="text-xs font-medium text-ink-500 ml-0.5">d</span>
          </p>
        </MoveXCard>

        <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
          <div className="w-8 h-8 rounded-lg icon-tile-blue flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Level</p>
          <p className="text-2xl font-bold text-ink-900 leading-tight mt-0.5 tabular-nums">
            {currentUser?.level || 1}
          </p>
        </MoveXCard>

        <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
          <div className="w-8 h-8 rounded-lg icon-tile-gold flex items-center justify-center mb-3">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Trophies</p>
          <p className="text-2xl font-bold text-ink-900 leading-tight mt-0.5 tabular-nums">
            {displayTrophies}
          </p>
        </MoveXCard>

        <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
          <div className="w-8 h-8 rounded-lg icon-tile-mint flex items-center justify-center mb-3">
            <Gauge className="w-4 h-4 text-white" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Avg AVS</p>
          <p className="text-2xl font-bold text-ink-900 leading-tight mt-0.5 tabular-nums">
            {avgAVS != null ? avgAVS : <span className="text-sm font-medium text-ink-400">--</span>}
          </p>
        </MoveXCard>
      </div>

      {/* FEATURED: Energy + This Week */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MoveXCard
          variant="premium"
          padded={false}
          className="lg:col-span-2 p-5 sm:p-6 flex flex-col justify-between min-h-[160px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl icon-tile-soft-blue flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#2563EB]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
              Total Energy
            </span>
          </div>
          <div className="mt-4">
            <p className="text-5xl sm:text-6xl font-bold text-ink-900 leading-none tabular-nums">
              {(currentUser?.energy || 0).toLocaleString()}
            </p>
            {weekEnergy > 0 ? (
              <p className="text-xs font-medium text-mint-600 mt-2">
                +{weekEnergy.toLocaleString()} this week
              </p>
            ) : (
              <p className="text-xs text-ink-400 mt-2">Start moving to earn Energy</p>
            )}
          </div>
        </MoveXCard>

        <MoveXCard variant="bento" padded={false} className="lg:col-span-1 p-5 shadow-premium">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
              This Week
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-500">Activities</span>
              <span className="text-base font-bold text-ink-900 tabular-nums">{thisWeek.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-500">Distance</span>
              <span className="text-base font-bold text-ink-900 tabular-nums">
                {weeklyDistance.toFixed(1)}<span className="text-[10px] font-medium text-ink-500 ml-0.5">km</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-500">Energy</span>
              <span className="text-base font-bold text-ink-900 tabular-nums">{weekEnergy}</span>
            </div>
          </div>
        </MoveXCard>
      </div>

      {/* XP PROGRESS */}
      <MoveXCard padded={false} className="p-4 shadow-premium">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-ink-700">
            Progress to Level {(currentUser?.level || 1) + 1}
          </p>
          <p className="text-xs font-semibold text-[#2563EB] tabular-nums">
            {currentUser?.xp || 0} / {xpForNextLevel} XP
          </p>
        </div>
        <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] shadow-sm"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </MoveXCard>

      {/* RECENT */}
      <div>
        <SectionHeader title="Recent Activities" icon={Activity} actionTo="/activity" actionLabel="View all" />
        <MoveXCard>
          {activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activities yet"
              message="Log your first activity to see it here."
              action={
                <Link
                  to="/start"
                  className="inline-flex items-center gap-2 bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white text-sm font-medium px-4 py-2 rounded-xl shadow-md shadow-[#2563EB]/25 transition"
                >
                  Start Activity <ArrowRight className="w-4 h-4" />
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-surface-100">
              {activities.slice(0, 5).map((act) => (
                <li key={act._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl icon-tile-soft-blue flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 capitalize truncate">{act.type}</p>
                      <p className="text-xs text-ink-500">
                        {act.distance ? `${Number(act.distance).toFixed(2)} km` : '--'}
                        {act.duration ? ` - ${Math.round(act.duration)} min` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-ink-400 shrink-0 ml-2">
                    {new Date(act.date || act.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </MoveXCard>
      </div>
    </motion.div>
  );
};

export default ProDashboard;