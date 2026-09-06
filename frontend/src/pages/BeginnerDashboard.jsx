import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Flame, Trophy, Zap, Activity, Clock, Gift, Target, TrendingUp, ArrowRight, MapPin
} from 'lucide-react';
import DashboardMap from '../components/DashboardMap';

const BeginnerDashboard = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState({ type: 'running', distance: 0, duration: 0 });
  const [currentUser, setCurrentUser] = useState(user);

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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/activity', { ...form, distance: Number(form.distance), duration: Number(form.duration) });
      fetchActivities();
      setForm({ type: 'running', distance: 0, duration: 0 });
      alert('Activity logged!');
    } catch (err) {
      console.error(err);
      alert('Error logging activity');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Hero */}
      <div className="bg-[#2563EB] text-white rounded-3xl p-6 md:p-8 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Move More. Earn More. Grow Stronger.</h1>
        <p className="text-white/80 mb-4">Stay consistent, complete your quests, and build your personal fitness journey.</p>
        <Link to="/start" className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-semibold px-5 py-2 rounded-full hover:bg-gray-100 transition">
          Start Activity <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: Map */}
        <div className="lg:w-1/3">
          <DashboardMap userRegion={currentUser?.region} />
        </div>

        {/* Right column: All other content */}
        <div className="lg:w-2/3 space-y-6">
          {/* Key Metrics */}
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
              <div className="flex items-center gap-2 text-[#2563EB] mb-1"><TrendingUp className="w-5 h-5" /><span className="text-sm text-gray-500">Level</span></div>
              <p className="text-2xl font-bold text-gray-800">{currentUser?.level || 1}</p>
            </div>
          </div>

          {/* Quest + AI Coach */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2"><Target className="w-5 h-5 text-[#2563EB]" /> Today's Quest</h2>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg"><span className="text-sm text-gray-700">Complete 20 min activity</span><span className="text-sm text-[#2563EB]">In Progress</span></div>
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg"><span className="text-sm text-gray-700">Maintain streak</span><span className="text-sm text-gray-500">Pending</span></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">AI Coach</h2>
              <p className="text-sm text-gray-600">"Great work on your consistency! You're one activity away from completing your weekly goal."</p>
              <Link to="/ai-coach" className="text-[#2563EB] text-sm font-medium mt-2 inline-block">Chat with Coach</Link>
            </div>
          </div>

          {/* Activity log & Recent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Log Activity</h2>
              <form onSubmit={handleSubmit} className="space-y-2">
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full p-2 border rounded">
                  <option value="running">Running</option>
                  <option value="cycling">Cycling</option>
                  <option value="walking">Walking</option>
                </select>
                <input type="number" placeholder="Distance (km)" value={form.distance} onChange={(e) => setForm({...form, distance: e.target.value})} className="w-full p-2 border rounded" />
                <input type="number" placeholder="Duration (min)" value={form.duration} onChange={(e) => setForm({...form, duration: e.target.value})} className="w-full p-2 border rounded" />
                <button type="submit" className="w-full bg-[#2563EB] text-white py-2 rounded">Save</button>
              </form>
            </div>
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
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BeginnerDashboard;