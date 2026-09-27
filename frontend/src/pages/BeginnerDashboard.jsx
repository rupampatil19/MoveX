import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Flame, Trophy, Zap, Activity, Target, TrendingUp, ArrowRight,
  Users, Bot, PlusCircle
} from 'lucide-react';
import DashboardMap from '../components/DashboardMap';
import MoveXCard from '../components/ui/MoveXCard';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import { useTrophy } from '../context/TrophyContext';

const BeginnerDashboard = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState({ type: 'running', distance: 0, duration: 0 });
  const [currentUser, setCurrentUser] = useState(user);
  const [clan, setClan] = useState(null);
  const [quests, setQuests] = useState([]);

  const { balance: trophyBalance, loading: trophyLoading } = useTrophy();

  useEffect(() => {
    fetchUser();
    fetchActivities();
    fetchClan();
    fetchQuests();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get('/auth/me');
      setCurrentUser(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchActivities = async () => {
    try {
      const res = await API.get('/activity/mine');
      setActivities(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchClan = async () => {
    try {
      const res = await API.get('/clans/my');
      if (res.data?.clan) setClan(res.data.clan);
    } catch (err) {}
  };

  const fetchQuests = async () => {
    try {
      const res = await API.get('/quests');
      setQuests(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/activity', {
        ...form,
        distance: Number(form.distance),
        duration: Number(form.duration),
      });
      fetchActivities();
      setForm({ type: 'running', distance: 0, duration: 0 });
    } catch (err) { console.error(err); }
  };

  const displayTrophies = trophyLoading
    ? (currentUser?.trophyPoints ?? 0)
    : (trophyBalance ?? currentUser?.trophyPoints ?? 0);

  const xpForNextLevel = 1000;
  const xpProgress = Math.min(
    ((currentUser?.xp || 0) % xpForNextLevel) / xpForNextLevel * 100,
    100
  );

  const weekAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);
  const weekActivities = useMemo(
    () => activities.filter((a) => new Date(a.date || a.createdAt) > weekAgo),
    [activities, weekAgo]
  );
  const weekEnergy = useMemo(
    () => weekActivities.reduce((sum, a) => sum + (Number(a.energyAwarded) || 0), 0),
    [weekActivities]
  );

  const activeQuest = useMemo(() => {
    if (!quests?.length) return null;
    const live = quests.filter((q) => q.status !== 'CLAIMED' && q.status !== 'EXPIRED');
    return live[0] || null;
  }, [quests]);

  const coachInsight = useMemo(() => {
    const streak = currentUser?.streak || 0;
    const weekCount = weekActivities.length;
    if (streak === 0 && weekCount === 0) return 'Log your first activity this week to get started with MoveX.';
    if (streak === 0 && weekCount > 0) return `You trained ${weekCount} time${weekCount === 1 ? '' : 's'} this week. Log one today to start a fresh streak.`;
    if (streak >= 1 && streak < 3) return `You're on a ${streak}-day streak. One more session keeps the momentum going.`;
    if (streak >= 3) return `Your ${streak}-day streak is building. Consistency is paying off.`;
    if (activeQuest) return 'You have an active quest. Open Quests to see your next move.';
    return 'Ask the AI Coach anything about your training, recovery, or progress.';
  }, [currentUser, weekActivities, activeQuest]);

  const renderActiveQuest = () => {
    if (!activeQuest) {
      return (
        <EmptyState
          icon={Target}
          title="No active quest right now"
          message="New challenges drop regularly. Check the Quests page for community and regional goals."
          action={
            <Link to="/quests" className="inline-flex items-center gap-2 bg-gradient-to-b from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-xl shadow-md shadow-[#2563EB]/25 transition">
              Browse Quests <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      );
    }
    const quest = activeQuest.questId || {};
    const progress = activeQuest.progress || 0;
    const target = quest.target || 0;
    const pct = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
    const isCompleted = activeQuest.status === 'COMPLETED';
    const unit =
      quest.metric === 'duration_minutes' ? 'min'
      : quest.metric === 'distance_km' ? 'km'
      : quest.metric === 'activities' ? 'acts'
      : quest.metric === 'energy' ? 'E'
      : '';

    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-ink-900 leading-tight">{quest.title || 'Active Quest'}</p>
          {quest.description && <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{quest.description}</p>}
        </div>
        <div>
          <div className="flex justify-between text-xs text-ink-700 mb-1.5">
            <span className="tabular-nums">{progress} / {target} {unit}</span>
            <span className="font-semibold tabular-nums">{Math.round(pct)}%</span>
          </div>
          <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${isCompleted ? 'bg-gradient-to-r from-mint-400 to-mint-500' : 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {(quest.reward?.energy > 0 || quest.reward?.xp > 0) && (
          <div className="flex items-center gap-3 text-xs">
            {quest.reward?.energy > 0 && (
              <span className="inline-flex items-center gap-1 text-gold-600 font-semibold">
                <Zap className="w-3.5 h-3.5" /> +{quest.reward.energy}
              </span>
            )}
            {quest.reward?.xp > 0 && (
              <span className="inline-flex items-center gap-1 text-[#2563EB] font-semibold">
                <Trophy className="w-3.5 h-3.5" /> +{quest.reward.xp}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5">

      {/* ============ PREMIUM HERO ============ */}
      <div className="relative hero-premium text-white rounded-hero p-5 sm:p-6 md:p-7">
        <div className="relative">

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
            Move, Compete &amp; Grow Together
          </h1>
          <p className="text-sm md:text-base text-white/85 mb-4 max-w-lg">
            Stay consistent, complete your quests, and build your fitness journey.
          </p>
          <Link
            to="/start"
            className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition text-sm shadow-lg shadow-black/10"
          >
            Start Activity <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ============ MAP + BENTO ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <DashboardMap userRegion={currentUser?.region} />
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3">
            {/* ENERGY — premium variant */}
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

            {/* TROPHIES */}
            <MoveXCard variant="bento" padded={false} className="p-4 min-h-[76px] flex flex-col justify-between shadow-premium">
              <div className="w-8 h-8 rounded-lg icon-tile-gold flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Trophies</p>
                <p className="text-2xl font-bold text-ink-900 leading-tight mt-0.5 tabular-nums">{displayTrophies}</p>
              </div>
            </MoveXCard>

            {/* STREAK */}
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

            {/* LEVEL */}
            <MoveXCard variant="bento" padded={false} className="p-4 min-h-[76px] flex flex-col justify-between shadow-premium">
              <div className="w-8 h-8 rounded-lg icon-tile-blue flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Level</p>
                <p className="text-2xl font-bold text-ink-900 leading-tight mt-0.5 tabular-nums">{currentUser?.level || 1}</p>
              </div>
            </MoveXCard>

            {/* CLAN */}
            <MoveXCard to="/clan" variant="bento" padded={false} className="p-4 min-h-[76px] flex flex-col justify-between shadow-premium hover:shadow-premium-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-lg icon-tile-soft-blue flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#2563EB]" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-ink-400" />
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">My Clan</p>
                <p className="text-xs font-semibold text-ink-900 leading-tight mt-0.5 truncate">
                  {clan?.name || 'No Clan Yet'}
                </p>
              </div>
            </MoveXCard>
          </div>

          {/* XP PROGRESS */}
          <MoveXCard padded={false} className="p-4 shadow-premium">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-ink-700">Progress to Level {(currentUser?.level || 1) + 1}</p>
              <p className="text-xs font-semibold text-[#2563EB] tabular-nums">{Math.round(xpProgress)}%</p>
            </div>
            <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] shadow-sm transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </MoveXCard>
        </div>
      </div>

      {/* ============ QUEST + AI COACH ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SectionHeader title="Today's Quest" icon={Target} actionTo="/quests" actionLabel="View all" />
          <MoveXCard variant="premium">{renderActiveQuest()}</MoveXCard>
        </div>
        <div>
          <SectionHeader title="AI Coach" icon={Bot} actionTo="/ai-coach" actionLabel="Chat" />
          <MoveXCard variant="premium">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl icon-tile-blue flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-ink-700 leading-relaxed pt-1">{coachInsight}</p>
            </div>
          </MoveXCard>
        </div>
      </div>

      {/* ============ QUICK LOG + RECENT ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SectionHeader title="Quick Log" icon={PlusCircle} />
          <MoveXCard>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
                >
                  <option value="running">Running</option>
                  <option value="walking">Walking</option>
                  <option value="cycling">Cycling</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Distance (km)</label>
                  <input type="number" step="0.1" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Duration (min)</label>
                  <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50" />
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-b from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-medium py-2.5 rounded-xl shadow-md shadow-[#2563EB]/25 transition">
                Save Activity
              </button>
            </form>
          </MoveXCard>
        </div>

        <div>
          <SectionHeader title="Recent Activities" icon={Activity} actionTo="/activity" actionLabel="View all" />
          <MoveXCard>
            {activities.length === 0 ? (
              <EmptyState icon={Activity} title="Your MoveX story starts here" message="Log your first activity to see it here."
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
      </div>
    </motion.div>
  );
};

export default BeginnerDashboard;