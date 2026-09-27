import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Flame, Trophy, Zap, Activity, Users, Building, Swords,
  ChevronRight, ArrowRight, TrendingUp
} from 'lucide-react';
import DashboardMap from '../components/DashboardMap';
import MoveXCard from '../components/ui/MoveXCard';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import { useTrophy } from '../context/TrophyContext';

const ProDashboard = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [community, setCommunity] = useState(null);
  const [clan, setClan] = useState(null);
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
      const [activityRes, communityRes, clanRes] = await Promise.all([
        API.get('/activity/mine'),
        API.get(`/community/${user.region}`).catch(() => null),
        API.get('/clans/my').catch(() => null),
      ]);
      setActivities(activityRes.data || []);
      if (communityRes?.data) setCommunity(communityRes.data);
      if (clanRes?.data?.clan) setClan(clanRes.data.clan);
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

      {/* PREMIUM HERO */}
      <div className="relative hero-premium text-white rounded-hero p-5 sm:p-6 md:p-7">
        <div className="relative">

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
            Elite Performance Center
          </h1>
          <p className="text-sm md:text-base text-white/85 mb-4 max-w-lg">
            Your performance, progress, and potential.
          </p>
          <Link to="/start" className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition text-sm shadow-lg shadow-black/10">
            Start Activity <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* MAP + BENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <DashboardMap userRegion={currentUser?.region} />
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3">
            <MoveXCard variant="premium" padded={false} className="col-span-2 row-span-2 p-5 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl icon-tile-soft-blue flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#2563EB]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Energy</span>
              </div>
              <div className="mt-4">
                <p className="text-4xl sm:text-5xl font-bold text-ink-900 leading-none tabular-nums">
                  {(currentUser?.energy || 0).toLocaleString()}
                </p>
                {weekEnergy > 0 ? (
                  <p className="text-xs font-medium text-mint-600 mt-1.5">+{weekEnergy.toLocaleString()} this week</p>
                ) : (
                  <p className="text-xs text-ink-400 mt-1.5">Start moving to earn Energy</p>
                )}
              </div>
            </MoveXCard>

            <MoveXCard variant="bento" padded={false} className="p-4 min-h-[76px] flex flex-col justify-between shadow-premium">
              <div className="w-8 h-8 rounded-lg icon-tile-gold flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Trophies</p>
                <p className="text-2xl font-bold text-ink-900 leading-tight mt-0.5 tabular-nums">{displayTrophies}</p>
              </div>
            </MoveXCard>

            <MoveXCard variant="bento" padded={false} className="p-4 min-h-[76px] flex flex-col justify-between shadow-premium">
              <div className="w-8 h-8 rounded-lg icon-tile-ember flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Streak</p>
                <p className="text-2xl font-bold text-ink-900 leading-tight mt-0.5 tabular-nums">
                  {currentUser?.streak || 0}<span className="text-xs font-medium text-ink-500 ml-0.5">d</span>
                </p>
              </div>
            </MoveXCard>

            <MoveXCard variant="bento" padded={false} className="p-4 min-h-[76px] flex flex-col justify-between shadow-premium">
              <div className="w-8 h-8 rounded-lg icon-tile-blue flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Activities</p>
                <p className="text-2xl font-bold text-ink-900 leading-tight mt-0.5 tabular-nums">{activities.length}</p>
              </div>
            </MoveXCard>

            <MoveXCard variant="bento" padded={false} className="p-4 min-h-[76px] flex flex-col justify-between shadow-premium">
              <div className="w-8 h-8 rounded-lg icon-tile-mint flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Avg AVS</p>
                <p className="text-2xl font-bold text-ink-900 leading-tight mt-0.5 tabular-nums">
                  {avgAVS != null ? avgAVS : <span className="text-sm font-medium text-ink-400">—</span>}
                </p>
              </div>
            </MoveXCard>
          </div>

          <MoveXCard padded={false} className="p-4 shadow-premium">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-ink-700">Progress to Level {(currentUser?.level || 1) + 1}</p>
              <p className="text-xs font-semibold text-[#2563EB] tabular-nums">{Math.round(xpProgress)}%</p>
            </div>
            <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] shadow-sm" style={{ width: `${xpProgress}%` }} />
            </div>
          </MoveXCard>
        </div>
      </div>

      {/* THIS WEEK */}
      <div>
        <SectionHeader title="This Week" icon={TrendingUp} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Activities</p>
            <p className="text-2xl font-bold text-ink-900 mt-1 tabular-nums">{thisWeek.length}</p>
          </MoveXCard>
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Distance</p>
            <p className="text-2xl font-bold text-ink-900 mt-1 tabular-nums">
              {weeklyDistance.toFixed(1)}<span className="text-xs font-medium text-ink-500 ml-0.5">km</span>
            </p>
          </MoveXCard>
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Energy</p>
            <p className="text-2xl font-bold text-ink-900 mt-1 tabular-nums">{weekEnergy}</p>
          </MoveXCard>
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Level</p>
            <p className="text-2xl font-bold text-ink-900 mt-1 tabular-nums">{currentUser?.level || 1}</p>
          </MoveXCard>
        </div>
      </div>

      {/* COMMUNITY */}
      <div>
        <SectionHeader title="Community" icon={Users} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <div className="w-10 h-10 rounded-xl icon-tile-soft-blue flex items-center justify-center mb-3">
              <Building className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-ink-900">Power Station</p>
            {community
              ? <p className="text-xs text-ink-500 mt-0.5">Level {community.powerStationLevel}</p>
              : <p className="text-xs text-ink-400 mt-0.5">No data yet</p>}
          </MoveXCard>

          <MoveXCard to="/clan" variant="bento" padded={false} className="p-4 shadow-premium hover:shadow-premium-lg transition-shadow">
            <div className="w-10 h-10 rounded-xl icon-tile-soft-blue flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-ink-900">My Clan</p>
            <p className="text-xs text-ink-500 mt-0.5 truncate">{clan?.name || 'No Clan Yet'}</p>
            <p className="text-xs text-[#2563EB] mt-1 font-medium">{clan ? 'View →' : 'Join a clan →'}</p>
          </MoveXCard>

          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <div className="w-10 h-10 rounded-xl icon-tile-soft-blue flex items-center justify-center mb-3">
              <Swords className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-ink-900">Clan Wars</p>
            <p className="text-xs text-ink-500 mt-0.5">No active wars</p>
          </MoveXCard>
        </div>
      </div>

      {/* RECENT */}
      <div>
        <SectionHeader title="Recent Activities" icon={Activity} actionTo="/activity" actionLabel="View all" />
        <MoveXCard>
          {activities.length === 0 ? (
            <EmptyState icon={Activity} title="No activities yet" message="Log your first activity to see it here."
              action={
                <Link to="/start" className="inline-flex items-center gap-2 bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white text-sm font-medium px-4 py-2 rounded-xl shadow-md shadow-[#2563EB]/25 transition">
                  Start Activity <ArrowRight className="w-4 h-4" />
                </Link>
              } />
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
                        {act.distance ? `${Number(act.distance).toFixed(2)} km` : '—'}
                        {act.duration ? ` · ${Math.round(act.duration)} min` : ''}
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