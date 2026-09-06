import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Activity, Route, Clock, Flame, TrendingUp, Award, BarChart3, LineChart, RefreshCw
} from 'lucide-react';
import {
  LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const AnalyticsPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const res = await API.get('/activity/mine');
      // Ensure date is a valid Date object for each activity
      const withValidDate = res.data.map(act => ({
        ...act,
        date: new Date(act.date),
      }));
      setActivities(withValidDate);
    } catch (err) {
      console.error(err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Refresh when the window/tab gains focus
    const handleFocus = () => fetchActivities(false);
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const totalWorkouts = activities.length;
  const totalDistance = activities.reduce((sum, act) => sum + (Number(act.distance) || 0), 0);
  const totalDuration = activities.reduce((sum, act) => sum + (Number(act.duration) || 0), 0);
  const totalCalories = activities.reduce((sum, act) => {
    const calPerKm = act.type === 'running' ? 60 : act.type === 'cycling' ? 30 : 45;
    return sum + (Number(act.distance) || 0) * calPerKm;
  }, 0);
  const totalEnergy = activities.reduce((sum, act) => sum + (Number(act.energyAwarded) || 0), 0);

  // Last 30 days activities sorted chronologically
  const now = Date.now();
  const last30Days = activities
    .filter(act => act.date && act.date.getTime() > now - 30 * 24 * 60 * 60 * 1000)
    .sort((a, b) => a.date - b.date);

  const distanceOverTime = last30Days.map(act => ({
    date: act.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    distance: Number(act.distance) || 0,
  }));

  const typeCount = activities.reduce((acc, act) => {
    acc[act.type] = (acc[act.type] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Historical Data Analysis</h1>
        <button
          onClick={() => fetchActivities()}
          className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-[#1D4ED8] transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading analytics...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Activity className="w-5 h-5" /><span className="text-sm text-gray-500">Workouts</span></div>
              <p className="text-2xl font-bold text-gray-800">{totalWorkouts}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Route className="w-5 h-5" /><span className="text-sm text-gray-500">Distance (km)</span></div>
              <p className="text-2xl font-bold text-gray-800">{totalDistance.toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Clock className="w-5 h-5" /><span className="text-sm text-gray-500">Duration (min)</span></div>
              <p className="text-2xl font-bold text-gray-800">{totalDuration}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Flame className="w-5 h-5" /><span className="text-sm text-gray-500">Energy</span></div>
              <p className="text-2xl font-bold text-gray-800">{totalEnergy}</p>
            </div>
          </div>

          {/* Distance Trend */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Distance Trend (Last 30 Days)</h2>
            {distanceOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsLine data={distanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3ECE4" />
                  <XAxis dataKey="date" stroke="#6B7C72" />
                  <YAxis stroke="#6B7C72" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E3ECE4' }} />
                  <Line type="monotone" dataKey="distance" stroke="#2563EB" strokeWidth={2} />
                </RechartsLine>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No distance data in the last 30 days.</p>
            )}
          </div>

          {/* Workout Types */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Workout Types</h2>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3ECE4" />
                  <XAxis dataKey="name" stroke="#6B7C72" />
                  <YAxis stroke="#6B7C72" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E3ECE4' }} />
                  <Bar dataKey="value" fill="#2563EB" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No workout types recorded yet.</p>
            )}
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Activities</h2>
            <ul className="space-y-2">
              {activities.slice(0, 5).map(act => (
                <li key={act._id} className="flex justify-between text-sm text-gray-700">
                  <span className="capitalize">{act.type}</span>
                  <span>{act.distance} km</span>
                  <span>{act.duration} min</span>
                  <span className="text-[#2563EB]">+{act.energyAwarded || 0} Energy</span>
                </li>
              ))}
              {activities.length === 0 && <li className="text-gray-500">No activities yet.</li>}
            </ul>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default AnalyticsPage;