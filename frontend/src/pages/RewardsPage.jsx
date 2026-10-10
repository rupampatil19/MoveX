import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import { Sparkles, Lock, Gift, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTrophy } from '../context/TrophyContext';
import { getBazaarStatus } from '../services/penaltyApi';

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
import GearSearch from '../components/gear/GearSearch';

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
  const [bazaarGate, setBazaarGate] = useState(null);

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
    getBazaarStatus().then((s) => setBazaarGate(s)).catch(() => {});
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

      {/* ============ REWARDS GATE ============ */}
      {bazaarGate && !bazaarGate.unlocked && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] p-5 sm:p-6 shadow-[0_8px_24px_-8px_rgba(245,158,11,0.25)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-0.5">
                MoveX Bazaar
              </p>
              <h2 className="text-lg font-bold text-amber-900 leading-tight">
                Warming up
              </h2>
              <p className="text-sm text-amber-900/75 mt-1">
                Welcome back! Complete <strong>7 consecutive active days</strong> to reopen the Bazaar.
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 bg-amber-500/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all"
                    style={{ width: Math.max((bazaarGate.progress / bazaarGate.target) * 100, 2) + '%' }}
                  />
                </div>
                <span className="text-xs font-bold text-amber-800 tabular-nums shrink-0">
                  {bazaarGate.progress} / {bazaarGate.target} days
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3 text-[11px] text-amber-800/80">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Miss a day resets the counter. No penalty, just restart.</span>
              </div>

              <Link
                to="/start"
                className="inline-flex items-center gap-1.5 mt-3 bg-gradient-to-b from-amber-500 to-amber-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-md shadow-amber-500/25 transition active:scale-[0.98]"
              >
                Log today's activity
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <TrophyBalanceHeader balance={displayBalance} loading={balanceLoading} />

      {!catalogLoading && displayBalance !== null && (
        <NextRewardProgress balance={displayBalance} rewards={catalog} />
      )}

      {/* TABS */}
      <div className="flex gap-1 border-b border-surface-200 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 no-scrollbar">
        {[
          { k: 'catalog', label: 'Catalog' },
          { k: 'gear', label: 'Gear Deals' },
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
                message="Try a different category or check back soon - new rewards drop weekly."
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

      {/* GEAR DEALS - powered by TinyFish live search */}
      {tab === 'gear' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg icon-tile-soft-blue flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">Live Gear Prices</p>
              <p className="text-[11px] text-ink-500">
                Real-time results from Flipkart, Amazon, and Decathlon
              </p>
            </div>
          </div>
          <GearSearch />
        </div>
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