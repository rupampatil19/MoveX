import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap, Activity, Clock, Gift, Target, TrendingUp, ArrowRight } from 'lucide-react';

const BeginnerDashboard = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState({ type: 'running', distance: 0, duration: 0 });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

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
      const res = await API.post('/activity', { ...form, distance: Number(form.distance), duration: Number(form.duration) });
      setStats(res.data.user);
      fetchActivities();
      setForm({ type: 'running', distance: 0, duration: 0 });
      alert('Great job! Activity logged.');
    } catch (err) {
      console.error(err);
      alert('Error logging activity');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Hero Card */}
      <div className="bg-[#2563EB] text-white rounded-3xl p-6 md:p-8 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Move More. Earn More. Grow Stronger.</h1>
        <p className="text-white/80 mb-4">Stay consistent, complete your quests, and build your personal fitness journey.</p>
        <Link to="/start" className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-semibold px-5 py-2 rounded-full hover:bg-gray-100 transition">
          Start Activity <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#2563EB] mb-1">
            <Zap className="w-5 h-5" />
            <span className="text-sm text-gray-500">Energy</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{user.energy || 0}</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-[#2563EB] h-1.5 rounded-full" style={{ width: `${Math.min(((user.energy || 0) / 1500) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#2563EB] mb-1">
            <Trophy className="w-5 h-5" />
            <span className="text-sm text-gray-500">Trophies</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{user.trophies?.length || 0}</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-[#2563EB] h-1.5 rounded-full" style={{ width: `${Math.min(((user.trophies?.length || 0) / 10) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#2563EB] mb-1">
            <Flame className="w-5 h-5" />
            <span className="text-sm text-gray-500">Streak</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{user.streak || 0} Days</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-[#2563EB] h-1.5 rounded-full" style={{ width: `${Math.min(((user.streak || 0) / 30) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#2563EB] mb-1">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm text-gray-500">Level</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{user.level || 1}</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-[#2563EB] h-1.5 rounded-full" style={{ width: `${Math.min(((user.xp || 0) % 1000) / 10, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Today's Quest + AI Coach */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#2563EB]" /> Today's Quest
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-gray-700">
                <Activity className="w-5 h-5 text-[#2563EB]" />
                <span>Complete 20 min activity</span>
              </div>
              <span className="text-sm font-semibold text-[#2563EB]">In Progress</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-gray-700">
                <Flame className="w-5 h-5 text-[#2563EB]" />
                <span>Maintain streak</span>
              </div>
              <span className="text-sm font-semibold text-gray-500">Pending</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">AI Coach</h2>
          <p className="text-gray-600 mb-4">"Great work on your consistency! You're one activity away from completing your weekly goal."</p>
          <Link to="/ai-coach" className="inline-flex items-center gap-2 text-[#2563EB] font-medium hover:text-[#1d4ed8]">
            Chat with Coach <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Activity logging and recent activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2563EB]" /> Log Activity
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({...form, type: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-800"
              >
                <option value="running">Running</option>
                <option value="cycling">Cycling</option>
                <option value="walking">Walking</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.distance}
                  onChange={(e) => setForm({...form, distance: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({...form, duration: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-800"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold py-3 rounded-lg transition"
            >
              Save Activity
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2563EB]" /> Recent Activities
          </h2>
          {activities.length === 0 ? (
            <p className="text-gray-500">No activities yet. Start your first workout!</p>
          ) : (
            <ul className="space-y-2">
              {activities.slice(0, 5).map((act) => (
                <li key={act._id} className="flex justify-between items-center border-b border-gray-100 py-2">
                  <span className="text-gray-600 capitalize">{act.type}</span>
                  <span className="text-gray-800 font-medium">{act.distance} km</span>
                  <span className="text-sm text-gray-400">{new Date(act.date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Community Impact and Challenges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Your Community Impact</h2>
          <p className="text-gray-600">Every verified move helps your community grow.</p>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Community Energy</span><span className="text-gray-800 font-medium">82,450</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Power Station</span><span className="text-gray-800 font-medium">Level 4</span></div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div className="bg-[#2563EB] h-2 rounded-full" style={{ width: '82%' }} />
            </div>
          </div>
          <Link to="/how-it-works" className="inline-flex items-center gap-2 mt-4 text-[#2563EB] font-medium hover:text-[#1d4ed8]">
            How MoveX Works <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Upcoming Challenges</h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-700">🔥 7 Day Streak</span><span className="text-gray-500">5/7</span></div>
              <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-[#2563EB] h-1.5 rounded-full" style={{ width: '71%' }} /></div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-700">🏃 10 KM Challenge</span><span className="text-gray-500">7.5/10 km</span></div>
              <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-[#2563EB] h-1.5 rounded-full" style={{ width: '75%' }} /></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BeginnerDashboard;