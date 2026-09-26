import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Flame, Trophy, Zap, Activity, Target, TrendingUp, ArrowRight, Users, Bot, PlusCircle
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

  const { balance: trophyBalance, loading: trophyLoading } = useTrophy();

  useEffect(() => {
    fetchUser();
    fetchActivities();
    fetchClan();
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
      setActivities(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchClan = async () => {
    try {
      const res = await API.get('/clans/my');
      if (res.data?.clan) setClan(res.data.clan);
    } catch (err) {}
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
  const xpProgress = Math.min(((currentUser?.xp || 0) % xpForNextLevel) / xpForNextLevel * 100, 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5">

      {/* HERO */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white rounded-3xl p-5 sm:p-6 md:p-7 shadow-hero">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
          Move, Compete & Grow Together
        </h1>
        <p className="text-sm md:text-base text-white/85 mb-4 max-w-lg">
          Stay consistent, complete your quests, and build your fitness journey.
        </p>
        <Link
          to="/start"
          className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition text-sm shadow-sm"
        >
          Start Activity <ArrowRight className="w-4 h-4" />
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
              <TrendingUp className="w-4 h-4 text-[#2563EB] mb-2" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Level</p>
              <p className="text-lg font-bold text-gray-900 leading-tight mt-0.5">{currentUser?.level || 1}</p>
            </MoveXCard>
          </div>

          <MoveXCard padded={false} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-600">Progress to next level</p>
              <p className="text-xs font-semibold text-[#2563EB]">{Math.round(xpProgress)}%</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] transition-all"
                style={{ width: `${xpProgress}%` }} />
            </div>
          </MoveXCard>

          <MoveXCard to="/clan" padded={false} className="p-4 hover:shadow-elevated transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">My Clan</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{clan?.name || 'No Clan Yet'}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          </MoveXCard>
        </div>
      </div>

      {/* QUEST + AI COACH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SectionHeader title="Today's Quest" icon={Target} actionTo="/quests" actionLabel="View all" />
          <MoveXCard>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">Complete 20 min activity</span>
                <span className="text-xs font-medium text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">In Progress</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">Maintain streak</span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Pending</span>
              </div>
            </div>
          </MoveXCard>
        </div>

        <div>
          <SectionHeader title="AI Coach" icon={Bot} actionTo="/ai-coach" actionLabel="Chat" />
          <MoveXCard>
            <p className="text-sm text-gray-700 leading-relaxed">
              Great work on your consistency! You're one activity away from completing your weekly goal.
            </p>
          </MoveXCard>
        </div>
      </div>

      {/* QUICK LOG + RECENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SectionHeader title="Quick Log" icon={PlusCircle} />
          <MoveXCard>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50">
                  <option value="running">Running</option>
                  <option value="walking">Walking</option>
                  <option value="cycling">Cycling</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Distance (km)</label>
                  <input type="number" step="0.1" value={form.distance}
                    onChange={(e) => setForm({ ...form, distance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
                  <input type="number" value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50" />
                </div>
              </div>
              <button type="submit"
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium py-2.5 rounded-xl transition">
                Save Activity
              </button>
            </form>
          </MoveXCard>
        </div>

        <div>
          <SectionHeader title="Recent Activities" icon={Activity} actionTo="/activity" actionLabel="View all" />
          <MoveXCard>
            {activities.length === 0 ? (
              <EmptyState icon={Activity} title="Your MoveX story starts here"
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
      </div>
    </motion.div>
  );
};

export default BeginnerDashboard;