import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Activity, Route, Clock, Zap, Trophy, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MoveXCard from '../components/ui/MoveXCard';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Button from '../components/ui/Button';

const STATUS_CONFIG = {
  VERIFIED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2 },
  PROBABLE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle },
  INVALID: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
  PENDING: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', icon: ShieldCheck },
};

const StatusPill = ({ status, avs }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {status || 'PENDING'}
      {avs > 0 && <span className="opacity-70">· {avs}</span>}
    </span>
  );
};

const ActivityHistoryPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/activity/mine');
        setActivities(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load activity history.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
        <MoveXCard><LoadingSkeleton variant="line" count={3} /></MoveXCard>
        <MoveXCard><LoadingSkeleton variant="line" count={3} /></MoveXCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
        <MoveXCard>
          <EmptyState
            icon={XCircle}
            title="Couldn't load activities"
            message={error}
            action={<Button onClick={() => window.location.reload()}>Retry</Button>}
          />
        </MoveXCard>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Activity History</h1>
        <p className="text-sm text-gray-500 mt-1">
          {activities.length > 0
            ? `${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}`
            : 'Your tracked activities'}
        </p>
      </div>

      {activities.length === 0 ? (
        <MoveXCard>
          <EmptyState
            icon={Activity}
            title="Your MoveX story starts here"
            message="Log your first activity to see it here."
            action={
              <Link to="/start">
                <Button variant="primary" icon={Activity}>Start Activity</Button>
              </Link>
            }
          />
        </MoveXCard>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => {
            const dateObj = new Date(act.date || act.createdAt);
            const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const status = act.verification?.status;

            return (
              <MoveXCard key={act._id} padded={false} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-[#2563EB]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 capitalize truncate">{act.type}</p>
                      <StatusPill status={status} avs={act.verification?.avs} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      {act.distance > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Route className="w-3.5 h-3.5" /> {act.distance} km
                        </span>
                      )}
                      {act.duration > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {act.duration} min
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" /> {formattedDate} · {formattedTime}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="inline-flex items-center gap-1 text-yellow-600 font-medium">
                        <Zap className="w-3.5 h-3.5" /> +{act.energyAwarded || 0} Energy
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#2563EB] font-medium">
                        <Trophy className="w-3.5 h-3.5" /> +{act.xpAwarded || 0} XP
                      </span>
                    </div>
                  </div>
                </div>
              </MoveXCard>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ActivityHistoryPage;