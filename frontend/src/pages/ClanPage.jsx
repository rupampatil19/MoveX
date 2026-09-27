import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Users, Search, Shield, Crown, Activity, Zap, Trophy, LogOut, X,
  Plus, Sparkles, ArrowRight, MapPin
} from 'lucide-react';
import MoveXCard from '../components/ui/MoveXCard';
import MoveXGlassPanel from '../components/ui/MoveXGlassPanel';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Button from '../components/ui/Button';

const ClanPage = ({ user }) => {
  const [myClan, setMyClan] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [publicClans, setPublicClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '🛡️',
    region: user.region || 'Kothrud',
    privacy: 'PUBLIC',
    maxMembers: 50,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [myRes, publicRes] = await Promise.all([
        API.get('/clans/my'),
        API.get('/clans'),
      ]);
      setMyClan(myRes.data.clan);
      setMyRole(myRes.data.memberRole);
      setMembers(myRes.data.members || []);
      setPublicClans(publicRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load clan data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClan = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/clans', form);
      setShowCreateForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create clan');
    }
  };

  const handleJoinClan = async (clanId) => {
    setError('');
    try {
      await API.post(`/clans/join/${clanId}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to join clan');
    }
  };

  const handleLeaveClan = async () => {
    if (!window.confirm('Leave this clan? You can rejoin later.')) return;
    setError('');
    try {
      await API.post('/clans/leave');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to leave clan');
    }
  };

  const filteredClans = publicClans.filter((clan) =>
    clan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="space-y-4 pb-28">
        <LoadingSkeleton variant="card" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <MoveXCard key={i} variant="bento" padded={false} className="p-4">
              <LoadingSkeleton variant="line" count={2} />
            </MoveXCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 sm:space-y-5 pb-28"
    >
      {/* ============ PREMIUM HERO ============ */}
      <div className="relative hero-premium text-white rounded-hero p-5 sm:p-6 md:p-7">
        <div className="relative">

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
            Find Your Clan
          </h1>
          <p className="text-sm md:text-base text-white/85 max-w-lg">
            Team up with athletes in your region. Train together, climb leaderboards, and grow your clan.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-700 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {/* ============ MY CLAN ============ */}
      <div>
        <SectionHeader title="My Clan" icon={Users} />

        {myClan ? (
          <MoveXCard variant="premium">
            {/* Clan header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-3xl shadow-hero ring-4 ring-white/60 shrink-0">
                {myClan.icon || '🛡️'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-ink-900 truncate">{myClan.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Crown className="w-3.5 h-3.5 text-gold-500" />
                    Level {myClan.level}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-ink-300" />
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {myClan.region}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-ink-300" />
                  <span className="uppercase text-[10px] font-bold tracking-wider">{myClan.privacy}</span>
                </div>
              </div>
            </div>

            {/* Bento stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="bg-surface-50 rounded-xl p-3">
                <Users className="w-4 h-4 text-[#2563EB] mb-1.5" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Members</p>
                <p className="text-base font-bold text-ink-900 mt-0.5 tabular-nums">
                  {members.length}<span className="text-xs text-ink-500 font-medium"> / {myClan.maxMembers}</span>
                </p>
              </div>
              <div className="bg-surface-50 rounded-xl p-3">
                <Zap className="w-4 h-4 text-gold-500 mb-1.5" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Energy</p>
                <p className="text-base font-bold text-ink-900 mt-0.5 tabular-nums">
                  {(myClan.energy || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-50 rounded-xl p-3">
                <Trophy className="w-4 h-4 text-[#2563EB] mb-1.5" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">XP</p>
                <p className="text-base font-bold text-ink-900 mt-0.5 tabular-nums">
                  {(myClan.xp || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-50 rounded-xl p-3">
                <Shield className="w-4 h-4 text-ember-500 mb-1.5" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Your Role</p>
                <p className="text-base font-bold text-ink-900 mt-0.5 capitalize">{myRole || 'Member'}</p>
              </div>
            </div>

            {myClan.description && (
              <p className="text-sm text-ink-600 mt-4 leading-relaxed">{myClan.description}</p>
            )}

            <div className="mt-5 pt-4 border-t border-surface-100">
              <Button
                variant="secondary"
                size="sm"
                icon={LogOut}
                onClick={handleLeaveClan}
                className="text-red-600 hover:bg-red-50 border-red-200"
              >
                Leave Clan
              </Button>
            </div>
          </MoveXCard>
        ) : (
          <MoveXCard>
            <EmptyState
              icon={Shield}
              title="No Clan Yet"
              message="Join a clan to train with athletes in your region, or create your own and lead the pack."
              action={
                <div className="flex gap-2">
                  <Button
                    variant="premium"
                    icon={Plus}
                    onClick={() => setShowCreateForm(true)}
                  >
                    Create Clan
                  </Button>
                </div>
              }
            />
          </MoveXCard>
        )}
      </div>

      {/* ============ CREATE CLAN MODAL ============ */}
      {showCreateForm && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowCreateForm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <MoveXGlassPanel className="max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl icon-tile-blue flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-ink-900">Create Clan</h2>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1.5 rounded-lg hover:bg-white/60 text-ink-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClan} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Clan Name</label>
                  <input
                    placeholder="e.g. MoveX Warriors"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-200 bg-white/80 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Description</label>
                  <input
                    placeholder="Short tagline"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-200 bg-white/80 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">Icon</label>
                    <input
                      placeholder="🛡️"
                      value={form.icon}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-surface-200 bg-white/80 text-sm text-ink-900 text-center focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">Max Members</label>
                    <input
                      type="number"
                      value={form.maxMembers}
                      onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-surface-200 bg-white/80 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Region</label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-200 bg-white/80 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
                  >
                    {['Kothrud', 'Hinjewadi', 'Baner', 'Viman Nagar', 'Hadapsar', 'Shivaji Nagar', 'Pimpri'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Privacy</label>
                  <select
                    value={form.privacy}
                    onChange={(e) => setForm({ ...form, privacy: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-200 bg-white/80 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
                  >
                    <option value="PUBLIC">Public — anyone can join</option>
                    <option value="PRIVATE">Private — invite only</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button variant="premium" type="submit" fullWidth>
                    Create
                  </Button>
                </div>
              </form>
            </MoveXGlassPanel>
          </motion.div>
        </div>
      )}

      {/* ============ PUBLIC CLANS ============ */}
      {!myClan && (
        <div>
          <SectionHeader title="Join a Clan" icon={Search} subtitle={`${filteredClans.length} clan${filteredClans.length === 1 ? '' : 's'} available`} />

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search clans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 bg-white text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50 shadow-soft"
            />
          </div>

          {filteredClans.length === 0 ? (
            <MoveXCard>
              <EmptyState
                icon={Users}
                title="No clans found"
                message={searchTerm ? 'Try a different search term.' : 'Be the first to create a clan in your region.'}
                action={
                  <Button variant="premium" icon={Plus} onClick={() => setShowCreateForm(true)}>
                    Create Clan
                  </Button>
                }
              />
            </MoveXCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredClans.map((clan) => (
                <MoveXCard
                  key={clan._id}
                  variant="bento"
                  padded={false}
                  className="p-4 shadow-premium hover:shadow-premium-lg transition-shadow duration-200"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-2xl shadow-md shrink-0">
                      {clan.icon || '🛡️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-ink-900 truncate">{clan.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-ink-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{clan.region}</span>
                        <span className="w-1 h-1 rounded-full bg-ink-300" />
                        <span className="uppercase font-semibold tracking-wider">{clan.accountType || 'BEGINNER'}</span>
                      </div>
                    </div>
                  </div>

                  {clan.description && (
                    <p className="text-xs text-ink-600 line-clamp-2 mb-3">{clan.description}</p>
                  )}

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-3">
                    <span className="inline-flex items-center gap-1 text-ink-700">
                      <Crown className="w-3.5 h-3.5 text-gold-500" />
                      <span className="font-semibold tabular-nums">Lvl {clan.level}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-ink-700">
                      <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="tabular-nums">{clan.members || 0}/{clan.maxMembers}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-gold-600 font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{(clan.energy || 0).toLocaleString()}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#2563EB] font-semibold">
                      <Trophy className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{clan.xp || 0}</span>
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    iconRight={ArrowRight}
                    onClick={() => handleJoinClan(clan._id)}
                  >
                    Join Clan
                  </Button>
                </MoveXCard>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ClanPage;