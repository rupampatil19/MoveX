import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  CheckCircle, AlertTriangle, XCircle, Zap, Trophy, Flame, BarChart3
} from 'lucide-react';
import MoveXCard from '../components/ui/MoveXCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const ActivityResultPage = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get(`/verification/${id}`);
        setResult(res.data);
      } catch (err) {
        console.error(err);
        setError('Could not load this activity result.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Activity Result</h1>
        <MoveXCard><LoadingSkeleton variant="line" count={4} /></MoveXCard>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Activity Result</h1>
        <MoveXCard>
          <EmptyState
            icon={XCircle}
            title="Result not found"
            message={error || 'This activity could not be loaded.'}
            action={<Link to="/activity"><Button>View History</Button></Link>}
          />
        </MoveXCard>
      </div>
    );
  }

  const { verification, energyAwarded, xpAwarded, tps, scoreBreakdown } = result;
  const status = verification?.status || 'PENDING';
  const statusColor =
    status === 'VERIFIED' ? 'text-green-600'
    : status === 'PROBABLE' ? 'text-amber-600'
    : status === 'INVALID' ? 'text-red-600'
    : 'text-gray-600';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Activity Result</h1>
        <p className="text-sm text-gray-500 mt-1">Verification summary and rewards.</p>
      </div>

      <MoveXCard hero>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">AVS Score</p>
            <p className="text-3xl font-bold text-gray-900">{verification?.avs ?? 0}<span className="text-lg text-gray-400">/100</span></p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${statusColor}`}>{status}</p>
            <p className="text-xs text-gray-500">Confidence: {verification?.confidence ?? '—'}</p>
          </div>
        </div>
      </MoveXCard>

      {tps !== undefined && (
        <MoveXCard>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-gray-900">Total Performance Score</h2>
          </div>
          <p className="text-3xl font-bold text-[#2563EB] mb-4">{tps} <span className="text-lg text-gray-400">/100</span></p>
          {scoreBreakdown && (
            <div className="space-y-3">
              <ScoreBar label="Effort" value={scoreBreakdown.effort} max={25} />
              <ScoreBar label="Performance" value={scoreBreakdown.performance} max={35} />
              <ScoreBar label="Consistency" value={scoreBreakdown.consistency} max={15} />
              <ScoreBar label="Health" value={scoreBreakdown.health} max={15} />
              <ScoreBar label="Fairness" value={scoreBreakdown.fairness} max={10} />
            </div>
          )}
        </MoveXCard>
      )}

      <div className="grid grid-cols-3 gap-3">
        <MoveXCard padded={false} className="p-4 text-center">
          <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">+{energyAwarded || 0}</p>
          <p className="text-xs text-gray-500">Energy</p>
        </MoveXCard>
        <MoveXCard padded={false} className="p-4 text-center">
          <Trophy className="w-5 h-5 text-[#2563EB] mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">+{xpAwarded || 0}</p>
          <p className="text-xs text-gray-500">XP</p>
        </MoveXCard>
        <MoveXCard padded={false} className="p-4 text-center">
          <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{verification?.steps?.length || 0}</p>
          <p className="text-xs text-gray-500">Signals</p>
        </MoveXCard>
      </div>

      {verification?.steps?.length > 0 && (
        <MoveXCard>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Verification Pipeline</h2>
          <ul className="space-y-3">
            {verification.steps.map((step) => (
              <li key={step.step} className="flex items-start gap-3">
                {step.status === 'GREEN' ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  : step.status === 'ORANGE' ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{step.name}</p>
                  {step.detail && <p className="text-xs text-gray-500">{step.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        </MoveXCard>
      )}

      <div className="flex gap-3">
        <Link to="/" className="flex-1">
          <Button variant="secondary" fullWidth>Dashboard</Button>
        </Link>
        <Link to="/activity" className="flex-1">
          <Button variant="primary" fullWidth>History</Button>
        </Link>
      </div>
    </motion.div>
  );
};

function ScoreBar({ label, value = 0, max }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{Number(value).toFixed(1)} / {max}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="bg-[#2563EB] h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default ActivityResultPage;