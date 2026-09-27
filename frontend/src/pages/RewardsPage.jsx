import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Sparkles, Gift, ArrowRight } from 'lucide-react';
import { useTrophy } from '../context/TrophyContext';

import TrophyBalanceHeader from '../components/rewards/TrophyBalanceHeader';
import RewardFilters from '../components/rewards/RewardFilters';
import RewardCard from '../components/rewards/RewardCard';
import NextRewardProgress from '../components/rewards/NextRewardProgress';
import RedemptionSuccessModal from '../components/rewards/RedemptionSuccessModal';
import MyRewardsList from '../components/rewards/MyRewardsList';
import RedemptionHistory from '../components/rewards/RedemptionHistory';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import MoveXCard from '../components/ui/MoveXCard';

const CATEGORY_MAP = {
  all: 'All',
  COSMETIC: 'Cosmetics',
  BOOST: 'Boosts',
  PARTNER: 'Partner Rewards',
  CLAN: 'Clan Perks',
  EXPERIENCE: 'Experiences',
};

const RewardsPage = () => {
  const { balance, loading: balanceLoading, applyBalance } = useTrophy();

  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [tab, setTab] = useState('catalog');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('recommended');
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadCatalog = useCallback(async () => {
    try {
      const { data } = await API.get('/rewards/catalog');
      setCatalog(data || []);
    } catch (err) {
      console.error('Catalog load error:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const visible = useMemo(() => {
    let list = catalog.filter((r) => category === 'all' || r.category === category);
    if (sort === 'cost_asc') list = [...list].sort((a, b) => a.trophyCost - b.trophyCost);
    if (sort === 'cost_desc') list = [...list].sort((a, b) => b.trophyCost - a.trophyCost);
    if (sort === 'newest')
      list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [catalog, category, sort]);

  const handleRedeem = async (reward) => {
    if (busy) return;
    setBusy(true);
    try {
      const idempotencyKey = `${reward._id}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const { data } = await API.post('/rewards/redeem', {
        rewardId: reward._id,
        idempotencyKey,
      });

      if (!data.ok) {
        if (data.error === 'insufficient_trophies') {
          alert(`You need ${(data.cost ?? 0) - (data.balance ?? 0)} more Trophies.`);
        } else {
          alert("Reward couldn't be redeemed right now.");
        }
        return;
      }
      applyBalance(data.new_balance);
      setSuccess(data);
      await loadCatalog();
    } catch (err) {
      const e = err.response?.data;
      if (e?.error === 'insufficient_trophies') {
        alert(`You need ${(e.cost ?? 0) - (e.balance ?? 0)} more Trophies.`);
      } else {
        alert('Redemption failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const displayBalance = balanceLoading ? null : balance ?? 0;

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
            Rewards &amp; Partner Perks
          </h1>
          <p className="text-sm md:text-base text-white/85 max-w-lg">
            Redeem your verified MoveX Trophies for cosmetics, boosts, and experiences.
          </p>
        </div>
      </div>

      <TrophyBalanceHeader balance={displayBalance} loading={balanceLoading} />

      {!catalogLoading && displayBalance !== null && (
        <NextRewardProgress balance={displayBalance} rewards={catalog} />
      )}

      {/* TABS */}
      <div className="flex gap-1 border-b border-surface-200 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 no-scrollbar">
        {[
          { k: 'catalog', label: 'Catalog' },
          { k: 'mine', label: 'My Rewards' },
          { k: 'history', label: 'History' },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
              tab === t.k
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-ink-500 hover:text-ink-900 hover:border-surface-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CATALOG */}
      {tab === 'catalog' && (
        <>
          <RewardFilters
            active={category}
            onChange={setCategory}
            labels={CATEGORY_MAP}
            sort={sort}
            onSortChange={setSort}
          />

          {catalogLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <MoveXCard key={i} variant="bento" padded={false} className="p-4 shadow-premium">
                  <LoadingSkeleton variant="card" />
                </MoveXCard>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <MoveXCard className="shadow-premium">
              <EmptyState
                icon={Gift}
                title="No rewards match this filter"
                message="Try a different category or check back soon — new rewards drop weekly."
              />
            </MoveXCard>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
            >
              {visible.map((r) => (
                <RewardCard
                  key={r._id}
                  reward={r}
                  balance={displayBalance ?? 0}
                  onRedeem={handleRedeem}
                  busy={busy}
                />
              ))}
            </motion.div>
          )}
        </>
      )}

      {tab === 'mine' && <MyRewardsList onRefresh={loadCatalog} />}
      {tab === 'history' && <RedemptionHistory />}

      {success && (
        <RedemptionSuccessModal
          result={success}
          onViewReward={() => {
            setSuccess(null);
            setTab('mine');
          }}
          onContinue={() => setSuccess(null)}
        />
      )}
    </motion.div>
  );
};

export default RewardsPage;