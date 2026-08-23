import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Activity, Route, Clock, Zap, Trophy, ShieldCheck, CalendarDays } from 'lucide-react';

const ActivityHistoryPage = () => {
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
      setError('Failed to load activity history');
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading activity history...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Activity History</h1>

      {activities.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          No activities yet. Start your first workout!
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map(act => {
            const statusColor = act.verification?.status === 'VERIFIED'
              ? 'text-blue-700'
              : act.verification?.status === 'PROBABLE'
              ? 'text-yellow-600'
              : act.verification?.status === 'INVALID'
              ? 'text-red-500'
              : 'text-gray-500';

            const dateObj = new Date(act.date);
            const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={act._id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-blue-200 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Activity type & meta */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 capitalize">{act.type}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Route className="w-4 h-4" /> {act.distance} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {act.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" /> {formattedDate} {formattedTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Verification & rewards */}
                  <div className="flex flex-col md:items-end gap-2">
                    <span className={`text-sm font-semibold flex items-center gap-1 ${statusColor}`}>
                      <ShieldCheck className="w-4 h-4" />
                      {act.verification?.status || 'PENDING'}
                      {act.verification?.avs > 0 && ` • AVS ${act.verification.avs}`}
                    </span>
                    <div className="flex gap-3 text-sm">
                      <span className="text-yellow-600 flex items-center gap-1">
                        <Zap className="w-4 h-4" /> +{act.energyAwarded || 0}
                      </span>
                      <span className="text-purple-600 flex items-center gap-1">
                        <Trophy className="w-4 h-4" /> +{act.xpAwarded || 0} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ActivityHistoryPage;