import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Activity, Route, Clock, Flame, TrendingUp, Award, BarChart3, LineChart
} from 'lucide-react';
import {
  LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const AnalyticsPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await API.get('/activity/mine');
      setActivities(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load activities');
      setLoading(false);
    }
  };

  const totalWorkouts = activities.length;
  const totalDistance = activities.reduce((sum, act) => sum + act.distance, 0);
  const totalDuration = activities.reduce((sum, act) => sum + act.duration, 0);
  const totalCalories = activities.reduce((sum, act) => {
    const calPerKm = act.type === 'running' ? 60 : act.type === 'cycling' ? 30 : 45;
    return sum + act.distance * calPerKm;
  }, 0);

  const last30Days = [...activities]
    .filter(act => new Date(act.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const distanceOverTime = last30Days.map(act => ({
    date: new Date(act.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    distance: act.distance,
  }));

  const typeCount = activities.reduce((acc, act) => {
    acc[act.type] = (acc[act.type] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

  if (loading) return <div className="p-6 text-gray-700">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Historical Data Analysis</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-blue-700 mb-2"><Activity className="w-5 h-5" /><span className="text-sm text-gray-500">Workouts</span></div>
          <p className="text-2xl font-bold text-gray-800">{totalWorkouts}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-blue-700 mb-2"><Route className="w-5 h-5" /><span className="text-sm text-gray-500">Distance (km)</span></div>
          <p className="text-2xl font-bold text-gray-800">{totalDistance.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-blue-700 mb-2"><Clock className="w-5 h-5" /><span className="text-sm text-gray-500">Duration (min)</span></div>
          <p className="text-2xl font-bold text-gray-800">{totalDuration}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-blue-700 mb-2"><Flame className="w-5 h-5" /><span className="text-sm text-gray-500">Calories</span></div>
          <p className="text-2xl font-bold text-gray-800">{totalCalories.toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Distance Trend (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <RechartsLine data={distanceOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3ECE4" />
            <XAxis dataKey="date" stroke="#6B7C72" />
            <YAxis stroke="#6B7C72" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E3ECE4' }} />
            <Line type="monotone" dataKey="distance" stroke="#2563EB" strokeWidth={2} />
          </RechartsLine>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Workout Types</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={typeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3ECE4" />
            <XAxis dataKey="name" stroke="#6B7C72" />
            <YAxis stroke="#6B7C72" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E3ECE4' }} />
            <Bar dataKey="value" fill="#2563EB" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;