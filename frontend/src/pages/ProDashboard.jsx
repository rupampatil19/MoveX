import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap, Activity, Users, Building, Swords, ChevronRight } from 'lucide-react';

const ProDashboard = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [community, setCommunity] = useState(null);
  const [clan, setClan] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Hero Card */}
      <div className="bg-[#2563EB] text-white rounded-3xl p-6 md:p-8 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold">Elite Performance Center</h1>
        <p className="text-white/80 mt-2">Your performance, progress, and potential.</p>
        <Link to="/start" className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-semibold px-5 py-2 rounded-full mt-4 hover:bg-gray-100 transition">
          Start Activity <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0D2138] border border-[#2563EB]/25 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[#2563EB] mb-1">
            <Zap className="w-5 h-5" />
            <span className="text-sm text-[#94A3B8]">Energy</span>
          </div>
          <p className="text-2xl font-bold text-white">{user.energy || 0}</p>
        </div>
        <div className="bg-[#0D2138] border border-[#20C9A6]/25 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[#20C9A6] mb-1">
            <Trophy className="w-5 h-5" />
            <span className="text-sm text-[#94A3B8]">Trophies</span>
          </div>
          <p className="text-2xl font-bold text-white">{user.trophies?.length || 0}</p>
        </div>
        <div className="bg-[#0D2138] border border-[#2563EB]/25 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[#2563EB] mb-1">
            <Flame className="w-5 h-5" />
            <span className="text-sm text-[#94A3B8]">Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{user.streak || 0} Days</p>
        </div>
        <div className="bg-[#0D2138] border border-[#2563EB]/25 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[#2563EB] mb-1">
            <Activity className="w-5 h-5" />
            <span className="text-sm text-[#94A3B8]">Activities</span>
          </div>
          <p className="text-2xl font-bold text-white">{activities.length}</p>
        </div>
      </div>

      {/* Advanced Analytics / Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0D2138] border border-[#2563EB]/25 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activities</h2>
          {activities.length === 0 ? (
            <p className="text-[#94A3B8]">No activities yet.</p>
          ) : (
            <ul className="space-y-2">
              {activities.slice(0, 5).map(act => (
                <li key={act._id} className="flex justify-between border-b border-[#2563EB]/20 py-2">
                  <span className="text-white capitalize">{act.type}</span>
                  <span className="text-[#94A3B8]">{act.distance} km • {act.duration} min</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[#0D2138] border border-[#2563EB]/25 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Performance Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">AVS</span>
              <span className="text-[#20C9A6] font-medium">92 / 100</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">Training Load</span>
              <span className="text-[#2563EB] font-medium">78%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">Consistency</span>
              <span className="text-[#20C9A6] font-medium">91%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community / Clan / Regional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0D2138] border border-[#2563EB]/25 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-lg font-semibold text-white">Power Station</h2>
          </div>
          {community ? (
            <>
              <p className="text-[#94A3B8]">Level {community.powerStationLevel}</p>
              <div className="w-full bg-[#071426] rounded-full h-2 mt-2">
                <div className="bg-[#2563EB] h-2 rounded-full" style={{ width: `${Math.min((community.powerStationCurrentEnergy / community.powerStationRequiredEnergy) * 100, 100)}%` }} />
              </div>
              <p className="text-sm text-[#94A3B8] mt-1">{community.powerStationCurrentEnergy} / {community.powerStationRequiredEnergy} Energy</p>
            </>
          ) : <p className="text-[#94A3B8]">No data</p>}
        </div>
        <div className="bg-[#0D2138] border border-[#2563EB]/25 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-lg font-semibold text-white">Clan</h2>
          </div>
          {clan ? (
            <>
              <p className="text-white">{clan.name}</p>
              <p className="text-sm text-[#94A3B8]">Level {clan.level} • {clan.tier}</p>
              <Link to="/clan" className="text-[#2563EB] text-sm mt-2 inline-block">View Clan</Link>
            </>
          ) : <p className="text-[#94A3B8]">No clan joined</p>}
        </div>
        <div className="bg-[#0D2138] border border-[#2563EB]/25 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Swords className="w-5 h-5 text-[#20C9A6]" />
            <h2 className="text-lg font-semibold text-white">Clan Wars</h2>
          </div>
          <p className="text-[#94A3B8]">No active wars</p>
        </div>
      </div>

      {/* AI Coach */}
      <div className="bg-[#0D2138] border border-[#2563EB]/25 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-2">AI Coach</h2>
        <p className="text-[#94A3B8]">"Your endurance has improved 8% this week."</p>
        <Link to="/ai-coach" className="inline-flex items-center gap-2 text-[#2563EB] mt-3 font-medium hover:text-[#1d4ed8]">
          View Plan <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
};

export default ProDashboard;