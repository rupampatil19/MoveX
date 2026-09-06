import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap, Activity, Users, Building, Swords, ChevronRight } from 'lucide-react';
import DashboardMap from '../components/DashboardMap';

const ProDashboard = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [community, setCommunity] = useState(null);
  const [clan, setClan] = useState(null);
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    fetchUser();
    fetchData();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get('/auth/me');
      setCurrentUser(res.data);
    } catch (err) {
      console.error(err);
    }
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Hero */}
      <div className="bg-[#2563EB] text-white rounded-3xl p-6 md:p-8 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold">Elite Performance Center</h1>
        <p className="text-white/80 mt-2">Your performance, progress, and potential.</p>
        <Link to="/start" className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-semibold px-5 py-2 rounded-full mt-4 hover:bg-gray-100 transition">
          Start Activity <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: Map */}
        <div className="lg:w-1/3">
          <DashboardMap userRegion={currentUser?.region} />
        </div>

        {/* Right column: Other content */}
        <div className="lg:w-2/3 space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-1"><Zap className="w-5 h-5" /><span className="text-sm text-gray-500">Energy</span></div>
              <p className="text-2xl font-bold text-gray-800">{currentUser?.energy || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-1"><Trophy className="w-5 h-5" /><span className="text-sm text-gray-500">Trophies</span></div>
              <p className="text-2xl font-bold text-gray-800">{currentUser?.trophies?.length || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-orange-500 mb-1"><Flame className="w-5 h-5" /><span className="text-sm text-gray-500">Streak</span></div>
              <p className="text-2xl font-bold text-gray-800">{currentUser?.streak || 0} Days</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-1"><Activity className="w-5 h-5" /><span className="text-sm text-gray-500">Activities</span></div>
              <p className="text-2xl font-bold text-gray-800">{activities.length}</p>
            </div>
          </div>

          {/* Recent / Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Recent Activities</h2>
              {activities.length === 0 ? <p className="text-sm text-gray-500">No activities yet.</p> : (
                <ul className="space-y-1">
                  {activities.slice(0,5).map(act => (
                    <li key={act._id} className="flex justify-between text-sm text-gray-700"><span>{act.type}</span><span>{act.distance} km</span></li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Performance Summary</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>AVS: 92/100</p>
                <p>Training Load: 78%</p>
                <p>Consistency: 91%</p>
              </div>
            </div>
          </div>

          {/* Community/Clan/Regional */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <Building className="w-5 h-5 text-[#2563EB] mb-1" />
              <h2 className="text-sm font-semibold text-gray-800">Power Station</h2>
              {community ? <p className="text-xs text-gray-600">Level {community.powerStationLevel}</p> : <p className="text-xs text-gray-500">No data</p>}
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <Users className="w-5 h-5 text-[#2563EB] mb-1" />
              <h2 className="text-sm font-semibold text-gray-800">Clan</h2>
              {clan ? <p className="text-xs text-gray-700">{clan.name}</p> : <p className="text-xs text-gray-500">No clan joined</p>}
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <Swords className="w-5 h-5 text-[#2563EB] mb-1" />
              <h2 className="text-sm font-semibold text-gray-800">Clan Wars</h2>
              <p className="text-xs text-gray-500">No active wars</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProDashboard;