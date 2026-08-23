import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Zap, Trophy, Flame, BarChart3 } from 'lucide-react';

const ActivityResultPage = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      const res = await API.get(`/verification/${id}`);
      setResult(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading result...</div>;
  if (!result) return <div className="p-6 text-gray-700">No result found</div>;

  const { verification, energyAwarded, xpAwarded, tps, scoreBreakdown } = result;
  const statusColor = verification.status === 'VERIFIED' ? 'text-blue-700' : verification.status === 'PROBABLE' ? 'text-orange-500' : 'text-red-500';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Activity Result</h1>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <p className="text-lg text-gray-800 mb-2">AVS: {verification.avs}/100</p>
        <p className={`text-2xl font-bold ${statusColor}`}>{verification.status}</p>
        <p className="text-gray-500">Confidence: {verification.confidence}</p>
      </div>

      {tps !== undefined && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            <h2 className="text-xl font-semibold text-gray-800">Total Performance Score (TPS)</h2>
          </div>
          <p className="text-4xl font-bold text-blue-700">{tps} / 100</p>
          {scoreBreakdown && (
            <div className="mt-4 space-y-3">
              <ScoreBar label="Effort" value={scoreBreakdown.effort} max={25} color="bg-orange-400" />
              <ScoreBar label="Performance" value={scoreBreakdown.performance} max={35} color="bg-blue-400" />
              <ScoreBar label="Consistency" value={scoreBreakdown.consistency} max={15} color="bg-blue-400" />
              <ScoreBar label="Health" value={scoreBreakdown.health} max={15} color="bg-red-400" />
              <ScoreBar label="Fairness" value={scoreBreakdown.fairness} max={10} color="bg-yellow-400" />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <Zap className="w-6 h-6 text-yellow-500 mx-auto" />
          <p className="text-gray-800 font-bold text-xl">+{energyAwarded}</p>
          <p className="text-gray-500 text-sm">Energy</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <Trophy className="w-6 h-6 text-purple-500 mx-auto" />
          <p className="text-gray-800 font-bold text-xl">+{xpAwarded}</p>
          <p className="text-gray-500 text-sm">XP</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto" />
          <p className="text-gray-800 font-bold text-xl">{verification.steps?.length || 0}/10</p>
          <p className="text-gray-500 text-sm">Steps</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Verification Pipeline</h2>
        <ul className="space-y-3">
          {verification.steps?.map(step => (
            <li key={step.step} className="flex items-center gap-3">
              {step.status === 'GREEN' ? <CheckCircle className="w-5 h-5 text-blue-500" /> : step.status === 'ORANGE' ? <AlertTriangle className="w-5 h-5 text-orange-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              <div>
                <p className="text-gray-800">{step.name}</p>
                <p className="text-sm text-gray-500">{step.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-4">
        <Link to="/" className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Dashboard</Link>
        <Link to="/activity" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">Activity History</Link>
      </div>
    </motion.div>
  );
};

function ScoreBar({ label, value, max, color }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>{value.toFixed(1)} / {max}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default ActivityResultPage;