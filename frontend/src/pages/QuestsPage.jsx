import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Zap, Trophy, Gift, Clock, ChevronRight, Target, ArrowRight
} from 'lucide-react';
import MoveXCard from '../components/ui/MoveXCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

const categories = ['ALL', 'DAILY', 'WEEKLY', 'COMMUNITY', 'REGIONAL', 'ATHLETE'];

const CATEGORY_STYLES = {
  DAILY:     { bg: 'bg-gradient-to-br from-[#3B82F6] to-[#2563EB]', text: 'text-white' },
  WEEKLY:    { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', text: 'text-white' },
  COMMUNITY: { bg: 'bg-gradient-to-br from-mint-400 to-mint-500', text: 'text-white' },
  REGIONAL:  { bg: 'bg-gradient-to-br from-gold-400 to-gold-500', text: 'text-white' },
  ATHLETE:   { bg: 'bg-gradient-to-br from-ember-400 to-ember-500', text: 'text-white' },
};

const QuestsPage = () => {
  const navigate = useNavigate();
  const [quests, setQuests] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/quests');
        setQuests(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load quests');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredQuests =
    filter === 'ALL' ? quests : quests.filter((q) => q.questId.category === filter);

  const handleClaim = async (userQuestId) => {
    try {
      await API.post(`/quests/${userQuestId}/claim`);
      const res = await API.get('/quests');
      setQuests(res.data);
    } catch (err) {
      alert(err.response?.data?.msg || 'Claim failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton variant="card" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MoveXCard key={i} variant="bento" padded={false} className="p-4 shadow-premium">
              <LoadingSkeleton variant="card" />
            </MoveXCard>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <MoveXCard>
        <EmptyState
          icon={Target}
          title="Couldn't load quests"
          message={error}
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      </MoveXCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 sm:space-y-5 pb-28"
    >
      {/* SPATIAL HERO */}
      <div className="relative hero-premium text-white rounded-hero p-5 sm:p-6 md:p-7 shadow-hero">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative">

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
            Quests &amp; Challenges
          </h1>
          <p className="text-sm md:text-base text-white/85 mb-4 max-w-2xl">
            Complete daily movement targets, weekly milestones, community goals, and regional challenges.
          </p>
          <button
            onClick={() => navigate('/start')}
            className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition text-sm shadow-md"
          >
            Start Quest Activity <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs sm:text-sm font-medium transition shrink-0 ${
              filter === cat
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'bg-white text-ink-700 border border-surface-200 hover:border-surface-300 hover:shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* QUESTS GRID */}
      {filteredQuests.length === 0 ? (
        <MoveXCard>
          <EmptyState
            icon={Target}
            title="No quests in this category"
            message="Try a different filter or check back soon for new challenges."
          />
        </MoveXCard>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredQuests.map((uq) => {
            const quest = uq.questId;
            const progressPercent =
              quest.target > 0 ? Math.min((uq.progress / quest.target) * 100, 100) : 0;
            const isCompleted = uq.status === 'COMPLETED';
            const isClaimed = uq.status === 'CLAIMED';
            const isExpired = uq.status === 'EXPIRED';

            const timeRemaining = quest.endTime
              ? new Date(quest.endTime).getTime() - Date.now()
              : 0;
            const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
            const daysLeft = Math.floor(hoursLeft / 24);

            const metricLabel =
              quest.metric === 'duration_minutes' ? 'min'
              : quest.metric === 'distance_km' ? 'km'
              : quest.metric === 'activities' ? 'acts'
              : quest.metric === 'energy' ? 'E'
              : '';

            return (
              <MoveXCard
                key={uq._id}
                variant="bento"
                padded={false}
                className="p-4 flex flex-col h-full shadow-premium hover:shadow-premium-lg transition-shadow duration-200"
              >
                {/* Header row */}
                <div className="flex justify-between items-start gap-1 mb-2">
                  <span className={`inline-block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm ${
                      (CATEGORY_STYLES[quest.category] || CATEGORY_STYLES.DAILY).bg
                    } ${
                      (CATEGORY_STYLES[quest.category] || CATEGORY_STYLES.DAILY).text
                    }`}>
                    {quest.category}
                  </span>
                  {timeRemaining > 0 && !isClaimed && !isExpired && (
                    <span className="text-[9px] sm:text-[10px] text-ink-500 inline-flex items-center gap-0.5 whitespace-nowrap">
                      <Clock className="w-2.5 h-2.5" />
                      {daysLeft > 0 ? `${daysLeft}d` : `${hoursLeft}h`}
                    </span>
                  )}
                  {isClaimed && (
                    <span className="text-[9px] sm:text-[10px] font-medium text-ink-400">
                      CLAIMED
                    </span>
                  )}
                  {isExpired && (
                    <span className="text-[9px] sm:text-[10px] font-medium text-red-500">
                      EXPIRED
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-semibold text-ink-900 leading-tight">
                  {quest.title}
                </h3>

                {/* Description */}
                <p className="text-[11px] sm:text-xs text-ink-500 mt-1 mb-3 flex-1 line-clamp-2">
                  {quest.description}
                </p>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] sm:text-xs text-ink-700 mb-1">
                    <span className="tabular-nums">
                      {uq.progress} / {quest.target} {metricLabel}
                    </span>
                    <span className="font-semibold tabular-nums">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isCompleted ? 'bg-mint-500' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Rewards */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
                  {quest.reward.energy > 0 && (
                    <span className="text-[10px] sm:text-xs font-semibold text-gold-600 inline-flex items-center gap-0.5">
                      <Zap className="w-3 h-3" /> +{quest.reward.energy}
                    </span>
                  )}
                  {quest.reward.xp > 0 && (
                    <span className="text-[10px] sm:text-xs font-semibold text-[#2563EB] inline-flex items-center gap-0.5">
                      <Trophy className="w-3 h-3" /> +{quest.reward.xp}
                    </span>
                  )}
                  {quest.reward.item && (
                    <span className="text-[10px] sm:text-xs font-semibold text-purple-600 inline-flex items-center gap-0.5">
                      <Gift className="w-3 h-3" /> {quest.reward.item}
                    </span>
                  )}
                </div>

                {/* Action */}
                <div>
                  {isClaimed ? (
                    <div className="text-center text-ink-400 py-2 text-xs font-medium">
                      Claimed
                    </div>
                  ) : isCompleted ? (
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => handleClaim(uq._id)}
                    >
                      Claim Reward
                    </Button>
                  ) : isExpired ? (
                    <div className="text-center text-red-500 py-2 text-xs font-medium">
                      Expired
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      iconRight={ChevronRight}
                      onClick={() => navigate('/start')}
                    >
                      Track
                    </Button>
                  )}
                </div>
              </MoveXCard>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default QuestsPage;