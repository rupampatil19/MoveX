import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Zap, Trophy, Gift, Clock, ChevronRight, CheckCircle2, Lock } from 'lucide-react';

const categories = ['ALL', 'DAILY', 'WEEKLY', 'COMMUNITY', 'REGIONAL', 'ATHLETE'];

const QuestsPage = () => {
  const [quests, setQuests] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const res = await API.get('/quests');
      setQuests(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load quests');
      setLoading(false);
    }
  };

  const filteredQuests = filter === 'ALL' ? quests : quests.filter(q => q.questId.category === filter);

  const handleClaim = async (userQuestId) => {
    try {
      await API.post(`/quests/${userQuestId}/claim`);
      alert('Reward claimed!');
      fetchQuests();
    } catch (err) {
      alert(err.response?.data?.msg || 'Claim failed');
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading quests...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Hero */}
      <div className="bg-blue-700 text-white rounded-3xl p-6 md:p-8 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold">MoveX Quests & Community Challenges</h1>
        <p className="text-blue-100 mt-2">Complete daily movement targets, weekly milestones, community goals and regional challenges to unlock Energy, Trophies, XP and rewards.</p>
        <button className="mt-4 bg-white text-blue-800 font-semibold px-5 py-2 rounded-full hover:bg-blue-50 transition">
          ⚡ Start Quest Activity
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              filter === cat
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Quest Cards */}
      {filteredQuests.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No quests found for this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredQuests.map(uq => {
            const quest = uq.questId;
            const progressPercent = quest.target > 0 ? Math.min((uq.progress / quest.target) * 100, 100) : 0;
            const isCompleted = uq.status === 'COMPLETED';
            const isClaimed = uq.status === 'CLAIMED';
            const isExpired = uq.status === 'EXPIRED';

            const timeRemaining = quest.endTime ? new Date(quest.endTime).getTime() - Date.now() : 0;
            const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
            const daysLeft = Math.floor(hoursLeft / 24);

            let statusBorder = 'border-gray-200';
            if (isCompleted) statusBorder = 'border-blue-300';
            if (isClaimed) statusBorder = 'border-gray-200';
            if (isExpired) statusBorder = 'border-red-200';

            return (
              <div key={uq._id} className={`bg-white border ${statusBorder} rounded-2xl p-5 shadow-sm`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">{quest.category}</span>
                  {timeRemaining > 0 && !isClaimed && !isExpired && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {daysLeft > 0 ? `${daysLeft}d` : `${hoursLeft}h`} left
                    </span>
                  )}
                  {isClaimed && <span className="text-xs text-gray-400">CLAIMED</span>}
                  {isExpired && <span className="text-xs text-red-500">EXPIRED</span>}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-1">{quest.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{quest.description}</p>

                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>
                      {uq.progress} / {quest.target}{' '}
                      {quest.metric === 'duration_minutes' ? 'min' :
                       quest.metric === 'distance_km' ? 'km' :
                       quest.metric === 'activities' ? 'activities' :
                       quest.metric === 'energy' ? 'Energy' : 'units'}
                    </span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isCompleted ? 'bg-blue-500' : 'bg-blue-400'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Rewards */}
                <div className="flex items-center gap-3 mb-4 text-sm">
                  {quest.reward.energy > 0 && (
                    <span className="text-yellow-600 flex items-center gap-1">
                      <Zap className="w-4 h-4" /> +{quest.reward.energy} Energy
                    </span>
                  )}
                  {quest.reward.xp > 0 && (
                    <span className="text-purple-600 flex items-center gap-1">
                      <Trophy className="w-4 h-4" /> +{quest.reward.xp} XP
                    </span>
                  )}
                  {quest.reward.item && (
                    <span className="text-blue-600 flex items-center gap-1">
                      <Gift className="w-4 h-4" /> {quest.reward.item}
                    </span>
                  )}
                </div>

                {/* Action */}
                {isClaimed ? (
                  <div className="text-center text-gray-400 py-2">✓ Claimed</div>
                ) : isCompleted ? (
                  <button
                    onClick={() => handleClaim(uq._id)}
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Claim Reward
                  </button>
                ) : isExpired ? (
                  <div className="text-center text-red-500 py-2">Quest Expired</div>
                ) : (
                  <button
                    onClick={() => {/* navigate to start activity */}}
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    Track <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default QuestsPage;