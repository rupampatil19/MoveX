import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Flame, Trophy, Zap, Activity, Users, Building, Swords, ChevronRight, ArrowRight, TrendingUp
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
      setActivities(activityRes.data);
      if (communityRes?.data) setCommunity(communityRes.data);
      if (clanRes?.data?.clan) setClan(clanRes.data.clan);
    } catch (err) { console.error(err); }
  };

  const displayTrophies = trophyLoading
    ? (currentUser?.trophyPoints ?? 0)
    : (trophyBalance ?? currentUser?.trophyPoints ?? 0);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = activities.filter(a => new Date(a.date || a.createdAt) > weekAgo);
  const weeklyDistance = thisWeek.reduce((s, a) => s + (Number(a.distance) || 0), 0);

  const verifiedActivities = activities.filter(a => a.verification?.avs);
  const avgAVS = verifiedActivities.length
    ? Math.round(verifiedActivities.reduce((s, a) => s + (a.verification.avs || 0), 0) / verifiedActivities.length)
    : null;

  const xpForNextLevel = 1000;
  const xpProgress = Math.min(((currentUser?.xp || 0) % xpForNextLevel) / xpForNextLevel * 100, 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5">

      {/* HERO */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white rounded-3xl p-5 sm:p-6 md:p-7 shadow-hero">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
          Elite Performance Center
        </h1>
        <p className="text-sm md:text-base text-white/85 mb-4 max-w-lg">
          Your performance, progress, and potential.
        </p>
        <Link to="/start"
          className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition text-sm shadow-sm">
          Start Activity <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* MAP + METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <DashboardMap userRegion={currentUser?.region} />
        </div>

        <div className="lg:col-span-2 space-y-3">
          <MoveXCard elevated padded={false} className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-[#2563EB]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Energy</p>
                <p className="text-3xl font-bold text-gray-900 leading-tight">{currentUser?.energy || 0}</p>
              </div>
            </div>
          </MoveXCard>

          <div className="grid grid-cols-3 gap-3">
            <MoveXCard padded={false} className="p-4">
              <Trophy className="w-4 h-4 text-[#2563EB] mb-2" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Trophies</p>
              <p className="text-lg font-bold text-gray-900 leading-tight mt-0.5">{displayTrophies}</p>
            </MoveXCard>
            <MoveXCard padded={false} className="p-4">
              <Flame className="w-4 h-4 text-orange-500 mb-2" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Streak</p>
              <p className="text-lg font-bold text-gray-900 leading-tight mt-0.5">
                {currentUser?.streak || 0}<span className="text-xs font-medium text-gray-500 ml-0.5">d</span>
              </p>
            </MoveXCard>
            <MoveXCard padded={false} className="p-4">
              <Activity className="w-4 h-4 text-[#2563EB] mb-2" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Activities</p>
              <p className="text-lg font-bold text-gray-900 leading-tight mt-0.5">{activities.length}</p>
            </MoveXCard>
          </div>

          <MoveXCard padded={false} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-600">Progress to next level</p>
              <p className="text-xs font-semibold text-[#2563EB]">{Math.round(xpProgress)}%</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8]"
                style={{ width: `${xpProgress}%` }} />
            </div>
          </MoveXCard>
        </div>
      </div>

      {/* THIS WEEK - real data */}
      <div>
        <SectionHeader title="This Week" icon={TrendingUp} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MoveXCard padded={false} className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Activities</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{thisWeek.length}</p>
          </MoveXCard>
          <MoveXCard padded={false} className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Distance</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {weeklyDistance.toFixed(1)}<span className="text-xs font-medium text-gray-500 ml-0.5">km</span>
            </p>
          </MoveXCard>
          <MoveXCard padded={false} className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Avg AVS</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {avgAVS != null ? avgAVS : <span className="text-sm font-medium text-gray-400">—</span>}
            </p>
          </MoveXCard>
          <MoveXCard padded={false} className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Level</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{currentUser?.level || 1}</p>
          </MoveXCard>
        </div>
      </div>

      {/* COMMUNITY */}
      <div>
        <SectionHeader title="Community" icon={Users} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MoveXCard padded={false} className="p-4">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center mb-3">
              <Building className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Power Station</p>
            {community
              ? <p className="text-xs text-gray-500 mt-0.5">Level {community.powerStationLevel}</p>
              : <p className="text-xs text-gray-400 mt-0.5">No data yet</p>}
          </MoveXCard>

          <MoveXCard to="/clan" padded={false} className="p-4 hover:shadow-elevated transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-gray-900">My Clan</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{clan?.name || 'No Clan Yet'}</p>
            <p className="text-xs text-[#2563EB] mt-1 font-medium">
              {clan ? 'View →' : 'Join a clan →'}
            </p>
          </MoveXCard>

          <MoveXCard padded={false} className="p-4">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center mb-3">
              <Swords className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Clan Wars</p>
            <p className="text-xs text-gray-500 mt-0.5">No active wars</p>
          </MoveXCard>
        </div>
      </div>

      {/* RECENT ACTIVITIES */}
      <div>
        <SectionHeader title="Recent Activities" icon={Activity} actionTo="/activity" actionLabel="View all" />
        <MoveXCard>
          {activities.length === 0 ? (
            <EmptyState icon={Activity} title="No activities yet"
              message="Log your first activity to see it here."
              action={
                <Link to="/start"
                  className="inline-flex items-center gap-2 bg-[#2563EB] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1D4ED8] transition">
                  Start Activity <ArrowRight className="w-4 h-4" />
                </Link>
              } />
          ) : (
            <ul className="divide-y divide-gray-100">
              {activities.slice(0, 5).map((act) => (
                <li key={act._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 capitalize truncate">{act.type}</p>
                      <p className="text-xs text-gray-500">
                        {act.distance ? `${act.distance} km` : '—'}
                        {act.duration ? ` · ${act.duration} min` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
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