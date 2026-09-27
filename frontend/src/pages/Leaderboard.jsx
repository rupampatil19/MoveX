import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Trophy, MapPin, Users, Globe2, TrendingUp, XCircle, Navigation
} from 'lucide-react';
import {
  getCityForRegion,
  getCityById,
  getStateById,
  getRegionsForCity,
  getCitiesForState,
} from '../data/geoHierarchy';
import MoveXCard from '../components/ui/MoveXCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';

/**
 * Format a number safely:
 *   - Removes float precision noise (71.7700000000001 -> 71.77)
 *   - Rounds to `decimals` places
 *   - Adds locale separators when `locale` is true
 */
function fmtNum(value, decimals = 0, locale = false) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  const rounded = Number(n.toFixed(decimals));
  return locale ? rounded.toLocaleString() : String(rounded);
}

function useGeoContext(user, searchParams) {
  return useMemo(() => {
    const scope = searchParams.get('scope');
    const regionId = searchParams.get('regionId');
    const cityId = searchParams.get('cityId');
    const stateId = searchParams.get('stateId');

    if (scope === 'global') return { level: 'global' };
    if (scope === 'state' && stateId) return { level: 'state', stateId, cityId: null, regionId: null };
    if (scope === 'city' && cityId) {
      const city = getCityById(cityId);
      return { level: 'city', stateId: city?.stateId || null, cityId, regionId: null };
    }
    if (scope === 'region' && regionId) {
      const city = getCityForRegion(regionId);
      return { level: 'region', stateId: city?.stateId || null, cityId: city?.id || null, regionId };
    }
    if (user?.region) {
      const city = getCityForRegion(user.region);
      if (city) return { level: 'region', stateId: city.stateId, cityId: city.id, regionId: user.region };
    }
    return { level: 'global' };
  }, [searchParams, user]);
}

function useTitleAndBreadcrumb(context, tab) {
  return useMemo(() => {
    const { level, stateId, cityId, regionId } = context;
    if (level === 'global') return { title: 'Global Leaderboard', breadcrumb: 'India', scopeLabel: 'Global' };

    const state = stateId ? getStateById(stateId) : null;
    const city = cityId ? getCityById(cityId) : null;

    if (tab === 'regions') {
      if (level === 'region' || level === 'city') {
        return {
          title: `${city?.name || 'City'} Regions`,
          breadcrumb: [city?.name, state?.name].filter(Boolean).join(' · '),
          scopeLabel: city?.name || 'City',
        };
      }
      if (level === 'state') {
        return { title: `${state?.name || 'State'} Regions`, breadcrumb: 'India', scopeLabel: state?.name || 'State' };
      }
    }
    if (level === 'region') {
      return {
        title: `${regionId} Leaderboard`,
        breadcrumb: [city?.name, state?.name].filter(Boolean).join(' · '),
        scopeLabel: regionId,
      };
    }
    if (level === 'city') {
      return { title: `${city?.name || 'City'} Leaderboard`, breadcrumb: state?.name || '', scopeLabel: city?.name || 'City' };
    }
    if (level === 'state') {
      return { title: `${state?.name || 'State'} Leaderboard`, breadcrumb: 'India', scopeLabel: state?.name || 'State' };
    }
    return { title: 'Leaderboard', breadcrumb: '', scopeLabel: '' };
  }, [context, tab]);
}

const Leaderboard = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const context = useGeoContext(user, searchParams);
  const [tab, setTab] = useState('athletes');
  const { title, breadcrumb, scopeLabel } = useTitleAndBreadcrumb(context, tab);

  const [athletes, setAthletes] = useState([]);
  const [regionsRanked, setRegionsRanked] = useState([]);
  const [globalLeaders, setGlobalLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const contextQuery = useMemo(() => {
    const q = new URLSearchParams();
    q.set('scope', context.level);
    if (context.stateId) q.set('stateId', context.stateId);
    if (context.cityId) q.set('cityId', context.cityId);
    if (context.regionId) q.set('regionId', context.regionId);
    return q.toString();
  }, [context]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (tab === 'athletes') {
          const res = await API.get(`/leaderboard?${contextQuery}`);
          if (alive) setAthletes(res.data || []);
        } else if (tab === 'regions') {
          const q = new URLSearchParams();
          if (context.cityId) {
            q.set('scope', 'city');
            q.set('cityId', context.cityId);
            if (context.stateId) q.set('stateId', context.stateId);
          } else if (context.stateId && context.level === 'state') {
            q.set('scope', 'state');
            q.set('stateId', context.stateId);
          } else {
            q.set('scope', 'global');
          }
          const res = await API.get(`/leaderboard/regions?${q.toString()}`);
          if (alive) setRegionsRanked(res.data || []);
        } else if (tab === 'global') {
          const res = await API.get('/leaderboard?scope=global');
          if (alive) setGlobalLeaders(res.data || []);
        }
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        if (alive) setError('Unable to load leaderboard data.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tab, contextQuery, context.cityId, context.stateId, context.level]);

  useEffect(() => {
    if (context.level === 'global' && tab !== 'global') setTab('global');
    else if (context.level !== 'global' && tab === 'global') setTab('athletes');
  }, [context.level]);

  const scopeSelector = useMemo(() => {
    if (tab !== 'athletes') return null;
    if (context.level === 'global') return null;

    if (context.level === 'region' && context.cityId) {
      const regions = getRegionsForCity(context.cityId);
      return {
        label: 'Region',
        items: regions,
        current: context.regionId,
        onPick: (rid) => setSearchParams({ scope: 'region', regionId: rid, cityId: context.cityId, stateId: context.stateId }),
      };
    }
    if (context.level === 'city' && context.cityId) {
      const regions = getRegionsForCity(context.cityId);
      return {
        label: 'Region',
        items: regions,
        current: null,
        onPick: (rid) => setSearchParams({ scope: 'region', regionId: rid, cityId: context.cityId, stateId: context.stateId }),
      };
    }
    if (context.level === 'state' && context.stateId) {
      const cities = getCitiesForState(context.stateId);
      return {
        label: 'City',
        items: cities,
        current: null,
        onPick: (cid) => setSearchParams({ scope: 'city', cityId: cid, stateId: context.stateId }),
      };
    }
    return null;
  }, [context, tab, setSearchParams]);

  const showRegionColumn = context.level !== 'region';
  const tabs = [
    context.level !== 'global' && { k: 'athletes', label: 'Top Athletes' },
    context.level !== 'global' && { k: 'regions', label: 'Regions' },
    { k: 'global', label: 'Global' },
  ].filter(Boolean);

  const isLoading = loading && athletes.length === 0 && globalLeaders.length === 0 && regionsRanked.length === 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-28">

      {/* GLASS CONTEXT BAR */}
      <div className="glass-strong rounded-panel p-4 sm:p-5 shadow-premium">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl icon-tile-blue flex items-center justify-center shrink-0 shadow-md">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {breadcrumb && (
              <div className="flex items-center gap-1 text-[11px] text-ink-500 mb-0.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{breadcrumb}</span>
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-ink-900 leading-tight truncate">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.k
                ? 'bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#2563EB]/25'
                : 'bg-white text-ink-600 border border-surface-200 hover:bg-surface-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SCOPE PILLS */}
      {scopeSelector && scopeSelector.items.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold text-ink-500 whitespace-nowrap shrink-0 uppercase tracking-widest">
            {scopeSelector.label}
          </span>
          {scopeSelector.items.map((item) => {
            const isCurrent = scopeSelector.current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scopeSelector.onPick(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? 'bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#2563EB]/25'
                    : 'bg-white text-ink-600 border border-surface-200 hover:bg-surface-50'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <MoveXCard>
          <EmptyState icon={XCircle} title="Couldn't load leaderboard" message={error} />
        </MoveXCard>
      )}

      {/* ============================================================
          TOP ATHLETES
          ============================================================ */}
      {tab === 'athletes' && !error && (
        isLoading ? (
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <LoadingSkeleton variant="line" count={6} />
          </MoveXCard>
        ) : athletes.length === 0 ? (
          <MoveXCard>
            <EmptyState
              icon={Users}
              title="No athletes here yet"
              message="Be the first to log an activity in this area and claim the top spot."
            />
          </MoveXCard>
        ) : (
          <MoveXCard variant="bento" padded={false} className="overflow-hidden shadow-premium">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-[#2563EB] text-white">
                    <th className="px-3 py-3 text-left font-semibold w-12 text-[10px] uppercase tracking-wider">#</th>
                    <th className="px-3 py-3 text-left font-semibold text-[10px] uppercase tracking-wider">Name</th>
                    {showRegionColumn && (
                      <th className="px-3 py-3 text-left font-semibold text-[10px] uppercase tracking-wider">Region</th>
                    )}
                    <th className="px-3 py-3 text-center font-semibold w-16 text-[10px] uppercase tracking-wider">Lvl</th>
                    <th className="px-3 py-3 text-right font-semibold w-24 text-[10px] uppercase tracking-wider">Energy</th>
                    <th className="px-3 py-3 text-right font-semibold w-20 text-[10px] uppercase tracking-wider">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map((u, i) => {
                    const isMe = u._id === user?.id;
                    const rankBg =
                      i === 0 ? 'bg-gold-500/5' :
                      i === 1 ? 'bg-surface-100/60' :
                      i === 2 ? 'bg-ember-500/5' :
                      '';
                    return (
                      <tr
                        key={u._id}
                        className={`border-t border-surface-200/60 transition-colors ${
                          isMe ? 'bg-[#2563EB]/5' : rankBg || 'hover:bg-surface-50/80'
                        }`}
                      >
                        <td className="px-3 py-3 text-ink-700 font-semibold tabular-nums">
                          {i < 3 ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                              i === 0 ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white ring-2 ring-gold-300/50 shadow-md shadow-gold-500/30' :
                              i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white ring-2 ring-slate-300/50 shadow-md shadow-slate-500/20' :
                              'bg-gradient-to-br from-ember-400 to-ember-600 text-white ring-2 ring-ember-300/50 shadow-md shadow-ember-500/30'
                            }`}>{i + 1}</span>
                          ) : (
                            i + 1
                          )}
                        </td>
                        <td className="px-3 py-3 text-ink-900 font-medium truncate max-w-[140px]">
                          {u.name}
                          {isMe && (
                            <span className="ml-2 text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">You</span>
                          )}
                        </td>
                        {showRegionColumn && (
                          <td className="px-3 py-3 text-ink-500 text-xs truncate max-w-[120px]">{u.region}</td>
                        )}
                        <td className="px-3 py-3 text-center text-ink-900 font-semibold tabular-nums">{u.level || 1}</td>
                        <td className="px-3 py-3 text-right text-gold-600 font-semibold tabular-nums">
                          {fmtNum(u.energy, 0, true)}
                        </td>
                        <td className="px-3 py-3 text-right text-ink-700 tabular-nums">{fmtNum(u.xp, 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </MoveXCard>
        )
      )}

      {/* ============================================================
          REGIONS RANKING
          ============================================================ */}
      {tab === 'regions' && !error && (
        isLoading ? (
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <LoadingSkeleton variant="line" count={6} />
          </MoveXCard>
        ) : regionsRanked.length === 0 ? (
          <MoveXCard>
            <EmptyState
              icon={TrendingUp}
              title="No region data yet"
              message="Once athletes in this area start logging activities, regions will rank here."
            />
          </MoveXCard>
        ) : (
          <MoveXCard variant="bento" padded={false} className="overflow-hidden shadow-premium">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-sm min-w-[460px]">
                <thead>
                  <tr className="bg-[#2563EB] text-white">
                    <th className="px-3 py-3 text-left font-semibold w-12 text-[10px] uppercase tracking-wider">#</th>
                    <th className="px-3 py-3 text-left font-semibold text-[10px] uppercase tracking-wider">Region</th>
                    <th className="px-3 py-3 text-center font-semibold w-16 text-[10px] uppercase tracking-wider">Lvl</th>
                    <th className="px-3 py-3 text-right font-semibold w-28 text-[10px] uppercase tracking-wider">Energy</th>
                  </tr>
                </thead>
                <tbody>
                  {regionsRanked.map((r, i) => (
                    <tr key={r.region || r.city || r.id || i} className="border-t border-surface-200/60 hover:bg-surface-50/60 transition-colors">
                      <td className="px-3 py-3 text-ink-700 font-semibold tabular-nums">
                        {i < 3 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                            i === 0 ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white ring-2 ring-gold-300/50 shadow-md shadow-gold-500/30' :
                            i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white ring-2 ring-slate-300/50 shadow-md shadow-slate-500/20' :
                            'bg-gradient-to-br from-ember-400 to-ember-600 text-white ring-2 ring-ember-300/50 shadow-md shadow-ember-500/30'
                          }`}>{i + 1}</span>
                        ) : (
                          i + 1
                        )}
                      </td>
                      <td className="px-3 py-3 text-ink-900 font-medium truncate">{r.region || r.name}</td>
                      <td className="px-3 py-3 text-center text-ink-900 tabular-nums">
                        {r.powerStationLevel || r.communityLevel || 1}
                      </td>
                      <td className="px-3 py-3 text-right text-ink-700 tabular-nums">
                        {fmtNum(r.totalEnergy, 0, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MoveXCard>
        )
      )}

      {/* ============================================================
          GLOBAL
          ============================================================ */}
      {tab === 'global' && !error && (
        isLoading ? (
          <MoveXCard variant="bento" padded={false} className="p-4 shadow-premium">
            <LoadingSkeleton variant="line" count={6} />
          </MoveXCard>
        ) : globalLeaders.length === 0 ? (
          <MoveXCard>
            <EmptyState
              icon={Globe2}
              title="No global data yet"
              message="Global rankings will appear once athletes start logging activities."
            />
          </MoveXCard>
        ) : (
          <MoveXCard variant="bento" padded={false} className="overflow-hidden shadow-premium">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-[#2563EB] text-white">
                    <th className="px-3 py-3 text-left font-semibold w-12 text-[10px] uppercase tracking-wider">#</th>
                    <th className="px-3 py-3 text-left font-semibold text-[10px] uppercase tracking-wider">Name</th>
                    <th className="px-3 py-3 text-left font-semibold text-[10px] uppercase tracking-wider">Region</th>
                    <th className="px-3 py-3 text-center font-semibold w-16 text-[10px] uppercase tracking-wider">Lvl</th>
                    <th className="px-3 py-3 text-right font-semibold w-24 text-[10px] uppercase tracking-wider">km</th>
                    <th className="px-3 py-3 text-right font-semibold w-20 text-[10px] uppercase tracking-wider">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {globalLeaders.map((u, i) => {
                    const isMe = u._id === user?.id;
                    return (
                      <tr
                        key={u._id}
                        className={`border-t border-surface-200/60 transition-colors ${
                          isMe ? 'bg-[#2563EB]/5' : 'hover:bg-surface-50/80'
                        }`}
                      >
                        <td className="px-3 py-3 text-ink-700 font-semibold tabular-nums">
                          {i < 3 ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                              i === 0 ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white ring-2 ring-gold-300/50 shadow-md shadow-gold-500/30' :
                              i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white ring-2 ring-slate-300/50 shadow-md shadow-slate-500/20' :
                              'bg-gradient-to-br from-ember-400 to-ember-600 text-white ring-2 ring-ember-300/50 shadow-md shadow-ember-500/30'
                            }`}>{i + 1}</span>
                          ) : (
                            i + 1
                          )}
                        </td>
                        <td className="px-3 py-3 text-ink-900 font-medium truncate max-w-[140px]">
                          {u.name}
                          {isMe && (
                            <span className="ml-2 text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">You</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-ink-500 text-xs truncate max-w-[120px]">{u.region}</td>
                        <td className="px-3 py-3 text-center text-ink-900 font-semibold tabular-nums">{u.level || 1}</td>
                        <td className="px-3 py-3 text-right text-ink-700 tabular-nums">{fmtNum(u.totalDistance, 2)}</td>
                        <td className="px-3 py-3 text-right text-ink-700 tabular-nums">{fmtNum(u.xp, 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </MoveXCard>
        )
      )}
    </motion.div>
  );
};

export default Leaderboard;