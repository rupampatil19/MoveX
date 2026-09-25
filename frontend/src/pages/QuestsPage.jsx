import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Zap, Trophy, Gift, Clock, ChevronRight } from 'lucide-react';

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 pt-2 pb-28 space-y-5"
    >
      {/* Hero — compact on mobile */}
      <div className="bg-blue-700 text-white rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
          MoveX Quests &amp; Community Challenges
        </h1>
        <p className="text-sm sm:text-base text-blue-100 mt-2">
          Complete daily movement targets, weekly milestones, community goals and regional challenges to unlock Energy, Trophies, XP and rewards.
        </p>
        <button className="mt-3 sm:mt-4 bg-white text-blue-800 font-semibold px-4 sm:px-5 py-2 rounded-full hover:bg-blue-50 transition text-sm sm:text-base">
          ⚡ Start Quest Activity
        </button>
      </div>

      {/* Filters — horizontal scroll only here, not the page */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap text-xs sm:text-sm font-medium transition shrink-0 ${
              filter === cat
                ? 'bg-[#2563EB] text-white'
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
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
              <div
                key={uq._id}
                className={`bg-white border ${statusBorder} rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm flex flex-col h-full`}
              >
                {/* Header row: category + time */}
                <div className="flex justify-between items-start gap-1 mb-2">
                  <span className="inline-block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    {quest.category}
                  </span>
                  {timeRemaining > 0 && !isClaimed && !isExpired && (
                    <span className="text-[9px] sm:text-[10px] text-gray-500 flex items-center gap-0.5 whitespace-nowrap">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {daysLeft > 0 ? `${daysLeft}d` : `${hoursLeft}h`}
                    </span>
                  )}
                  {isClaimed && (
                    <span className="text-[9px] sm:text-[10px] text-gray-400">CLAIMED</span>
                  )}
                  {isExpired && (
                    <span className="text-[9px] sm:text-[10px] text-red-500">EXPIRED</span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                  {quest.title}
                </h3>

                {/* Description */}
                <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 mt-1 line-clamp-2 flex-1">
                  {quest.description}
                </p>

                {/* Progress */}
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] sm:text-xs text-gray-600 mb-1">
                    <span>
                      {uq.progress} / {quest.target}{' '}
                      {quest.metric === 'duration_minutes' ? 'min' :
                       quest.metric === 'distance_km' ? 'km' :
                       quest.metric === 'activities' ? 'acts' :
                       quest.metric === 'energy' ? 'E' : ''}
                    </span>
                    <span className="font-semibold">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                    <div
                      className={`h-1.5 sm:h-2 rounded-full transition-all ${isCompleted ? 'bg-blue-500' : 'bg-blue-400'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Rewards — compact chips like RewardCard */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-2">
                  {quest.reward.energy > 0 && (
                    <span className="text-[10px] sm:text-xs font-semibold text-yellow-600 flex items-center gap-0.5">
                      <Zap className="w-3 h-3" /> +{quest.reward.energy}
                    </span>
                  )}
                  {quest.reward.xp > 0 && (
                    <span className="text-[10px] sm:text-xs font-semibold text-purple-600 flex items-center gap-0.5">
                      <Trophy className="w-3 h-3" /> +{quest.reward.xp}
                    </span>
                  )}
                  {quest.reward.item && (
                    <span className="text-[10px] sm:text-xs font-semibold text-blue-600 flex items-center gap-0.5">
                      <Gift className="w-3 h-3" /> {quest.reward.item}
                    </span>
                  )}
                </div>

                {/* Action */}
                <div className="mt-3">
                  {isClaimed ? (
                    <div className="text-center text-gray-400 py-2 text-xs sm:text-sm">
                      ✓ Claimed
                    </div>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaim(uq._id)}
                      className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition text-xs sm:text-sm"
                    >
                      Claim Reward
                    </button>
                  ) : isExpired ? (
                    <div className="text-center text-red-500 py-2 text-xs sm:text-sm">
                      Quest Expired
                    </div>
                  ) : (
                    <button
                      onClick={() => {/* navigate to start activity */}}
                      className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1 text-xs sm:text-sm"
                    >
                      Track <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default QuestsPage;