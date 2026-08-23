import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap, Activity, Clock } from 'lucide-react';

const Dashboard = ({ user }) => {
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
      alert(`Level up! You are now level ${res.data.user.level}`);
    } catch (err) {
      console.error(err);
      alert('Error logging activity');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-[#0B1F2A] border border-cyan-500/20 rounded-2xl p-5 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-400">Energy</p>
              <p className="text-2xl font-bold text-white">1,240</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0B1F2A] border border-purple-500/20 rounded-2xl p-5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-sm text-gray-400">Trophies</p>
              <p className="text-2xl font-bold text-white">86</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0B1F2A] border border-orange-500/20 rounded-2xl p-5 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-sm text-gray-400">Streak</p>
              <p className="text-2xl font-bold text-white">{user.streak || 7} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity form + Recent activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity logging */}
        <div className="bg-[#0B1F2A] border border-cyan-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> Log Activity
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({...form, type: e.target.value})}
                className="w-full bg-[#0F2A3A] border border-white/10 rounded-lg p-3 text-white"
              >
                <option value="running">Running</option>
                <option value="cycling">Cycling</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.distance}
                  onChange={(e) => setForm({...form, distance: e.target.value})}
                  className="w-full bg-[#0F2A3A] border border-white/10 rounded-lg p-3 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({...form, duration: e.target.value})}
                  className="w-full bg-[#0F2A3A] border border-white/10 rounded-lg p-3 text-white"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 rounded-lg hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition"
            >
              Save Activity
            </button>
          </form>
        </div>

        {/* Recent Activities */}
        <div className="bg-[#0B1F2A] border border-cyan-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" /> Recent Activities
          </h2>
          {activities.length === 0 ? (
            <p className="text-gray-400">No activities yet.</p>
          ) : (
            <ul className="space-y-2">
              {activities.slice(0, 5).map((act) => (
                <li key={act._id} className="flex justify-between items-center border-b border-white/10 py-2">
                  <span className="text-gray-300 capitalize">{act.type}</span>
                  <span className="text-white">{act.distance} km</span>
                  <span className="text-sm text-gray-400">{new Date(act.date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Analytics link */}
      <div className="bg-[#0B1F2A] border border-cyan-500/20 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-2">Historical Data Analysis</h2>
        <p className="text-gray-400 mb-4">View detailed analytics and insights powered by Power BI.</p>
        <Link to="/analytics" className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-4 py-3 rounded-lg transition">
          Open Analytics →
        </Link>
      </div>

      {/* How MoveX Works link card */}
      <Link to="/how-it-works" className="block bg-[#0B1F2A] border border-cyan-500/20 rounded-2xl p-6 text-center hover:border-cyan-400 transition">
        <h2 className="text-xl font-semibold text-white">How MoveX Works</h2>
        <p className="text-gray-400">See how your activity powers both you and your community.</p>
        <span className="text-cyan-400">Explore →</span>
      </Link>
    </motion.div>
  );
};

export default Dashboard;