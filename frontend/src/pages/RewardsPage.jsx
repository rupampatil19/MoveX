import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Sparkles, Gift } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto pt-2 pb-28 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#2563EB]" size={24} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            MoveX Bazaar &amp; Rewards
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Redeem your verified MoveX Trophies
        </p>
      </div>

      <TrophyBalanceHeader balance={displayBalance} loading={balanceLoading} />

      {!catalogLoading && displayBalance !== null && (
        <NextRewardProgress balance={displayBalance} rewards={catalog} />
      )}

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto -mx-4 px-4">
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
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
                <LoadingSkeleton key={i} variant="card" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft">
              <EmptyState
                icon={Gift}
                title="No rewards match this filter"
                message="Try a different category or check back soon — new rewards drop weekly."
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
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
    </div>
  );
};

export default RewardsPage;