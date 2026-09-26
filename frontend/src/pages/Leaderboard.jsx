import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Trophy, MapPin, Users, Globe2, TrendingUp, XCircle, Zap
} from 'lucide-react';
import {
  getCityForRegion,
  getCityById,
  getStateById,
  getRegionsForCity,
  getCitiesForState,
} from '../data/geoHierarchy';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';

function useGeoContext(user, searchParams) {
  return useMemo(() => {
    const scope = searchParams.get('scope');
    const regionId = searchParams.get('regionId');
    const cityId = searchParams.get('cityId');
    const stateId = searchParams.get('stateId');

    if (scope === 'global') return { level: 'global' };

    if (scope === 'state' && stateId) {
      return { level: 'state', stateId, cityId: null, regionId: null };
    }

    if (scope === 'city' && cityId) {
      const city = getCityById(cityId);
      return {
        level: 'city',
        stateId: city?.stateId || null,
        cityId,
        regionId: null,
      };
    }

    if (scope === 'region' && regionId) {
      const city = getCityForRegion(regionId);
      return {
        level: 'region',
        stateId: city?.stateId || null,
        cityId: city?.id || null,
        regionId,
      };
    }

    if (user?.region) {
      const city = getCityForRegion(user.region);
      if (city) {
        return {
          level: 'region',
          stateId: city.stateId,
          cityId: city.id,
          regionId: user.region,
        };
      }
    }

    return { level: 'global' };
  }, [searchParams, user]);
}

function useTitleAndBreadcrumb(context, tab) {
  return useMemo(() => {
    const { level, stateId, cityId, regionId } = context;

    if (level === 'global') {
      return { title: 'Global Leaderboard', breadcrumb: 'India' };
    }

    const state = stateId ? getStateById(stateId) : null;
    const city = cityId ? getCityById(cityId) : null;

    if (tab === 'regions') {
      if (level === 'region' || level === 'city') {
        return {
          title: `${city?.name || 'City'} Regions Ranking`,
          breadcrumb: [city?.name, state?.name].filter(Boolean).join(' · '),
        };
      }
      if (level === 'state') {
        return {
          title: `${state?.name || 'State'} Regions Ranking`,
          breadcrumb: 'India',
        };
      }
    }

    if (level === 'region') {
      return {
        title: `${regionId} Leaderboard`,
        breadcrumb: [city?.name, state?.name].filter(Boolean).join(' · '),
      };
    }
    if (level === 'city') {
      return {
        title: `${city?.name || 'City'} Leaderboard`,
        breadcrumb: state?.name || '',
      };
    }
    if (level === 'state') {
      return {
        title: `${state?.name || 'State'} Leaderboard`,
        breadcrumb: 'India',
      };
    }
    return { title: 'Leaderboard', breadcrumb: '' };
  }, [context, tab]);
}

const Leaderboard = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const context = useGeoContext(user, searchParams);
  const [tab, setTab] = useState('athletes');
  const { title, breadcrumb } = useTitleAndBreadcrumb(context, tab);

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
    return () => {
      alive = false;
    };
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
        onPick: (rid) => {
          setSearchParams({
            scope: 'region',
            regionId: rid,
            cityId: context.cityId,
            stateId: context.stateId,
          });
        },
      };
    }
    if (context.level === 'city' && context.cityId) {
      const regions = getRegionsForCity(context.cityId);
      return {
        label: 'Region',
        items: regions,
        current: null,
        onPick: (rid) => {
          setSearchParams({
            scope: 'region',
            regionId: rid,
            cityId: context.cityId,
            stateId: context.stateId,
          });
        },
      };
    }
    if (context.level === 'state' && context.stateId) {
      const cities = getCitiesForState(context.stateId);
      return {
        label: 'City',
        items: cities,
        current: null,
        onPick: (cid) => {
          setSearchParams({
            scope: 'city',
            cityId: cid,
            stateId: context.stateId,
          });
        },
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-2 pb-28 space-y-4"
    >
      {/* Header */}
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <MapPin className="w-3 h-3" />
            <span>{breadcrumb}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <Trophy className="w-6 h-6 text-[#2563EB] shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.k
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scope pills */}
      {scopeSelector && scopeSelector.items.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap shrink-0 uppercase tracking-wider">
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
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft">
          <EmptyState
            icon={XCircle}
            title="Couldn't load leaderboard"
            message={error}
          />
        </div>
      )}

      {/* ---- Top Athletes ---- */}
      {tab === 'athletes' && !error && (
        isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft p-4">
            <LoadingSkeleton variant="line" count={6} />
          </div>
        ) : athletes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft">
            <EmptyState
              icon={Users}
              title="No athletes here yet"
              message="Be the first to log an activity in this area and claim the top spot."
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-[#2563EB] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold w-12 text-xs uppercase tracking-wider">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Name</th>
                    {showRegionColumn && (
                      <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Region</th>
                    )}
                    <th className="px-3 py-2.5 text-center font-semibold w-16 text-xs uppercase tracking-wider">Lvl</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-24 text-xs uppercase tracking-wider">Energy</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-20 text-xs uppercase tracking-wider">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map((u, i) => (
                    <tr
                      key={u._id}
                      className={`border-t border-gray-100 transition-colors ${
                        u._id === user?.id ? 'bg-[#2563EB]/5' : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <td className="px-3 py-2.5 text-gray-700 font-semibold tabular-nums">{i + 1}</td>
                      <td className="px-3 py-2.5 text-gray-900 font-medium truncate max-w-[140px]">
                        {u.name}
                        {u._id === user?.id && (
                          <span className="ml-2 text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">You</span>
                        )}
                      </td>
                      {showRegionColumn && (
                        <td className="px-3 py-2.5 text-gray-500 text-xs truncate max-w-[120px]">{u.region}</td>
                      )}
                      <td className="px-3 py-2.5 text-center text-gray-800 font-semibold tabular-nums">{u.level || 1}</td>
                      <td className="px-3 py-2.5 text-right text-yellow-600 font-semibold tabular-nums">
                        {(u.energy || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">{u.xp || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ---- Regions Ranking ---- */}
      {tab === 'regions' && !error && (
        isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft p-4">
            <LoadingSkeleton variant="line" count={6} />
          </div>
        ) : regionsRanked.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft">
            <EmptyState
              icon={TrendingUp}
              title="No region data yet"
              message="Once athletes in this area start logging activities, regions will rank here."
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[460px]">
                <thead>
                  <tr className="bg-[#2563EB] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold w-12 text-xs uppercase tracking-wider">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Region</th>
                    <th className="px-3 py-2.5 text-center font-semibold w-16 text-xs uppercase tracking-wider">Lvl</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-28 text-xs uppercase tracking-wider">Energy</th>
                  </tr>
                </thead>
                <tbody>
                  {regionsRanked.map((r, i) => (
                    <tr key={r.region || r.city || r.id || i} className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors">
                      <td className="px-3 py-2.5 text-gray-700 font-semibold tabular-nums">{i + 1}</td>
                      <td className="px-3 py-2.5 text-gray-900 font-medium truncate">{r.region || r.name}</td>
                      <td className="px-3 py-2.5 text-center text-gray-800 tabular-nums">
                        {r.powerStationLevel || r.communityLevel || 1}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">
                        {(r.totalEnergy || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ---- Global ---- */}
      {tab === 'global' && !error && (
        isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft p-4">
            <LoadingSkeleton variant="line" count={6} />
          </div>
        ) : globalLeaders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft">
            <EmptyState
              icon={Globe2}
              title="No global data yet"
              message="Global rankings will appear once athletes start logging activities."
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-[#2563EB] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold w-12 text-xs uppercase tracking-wider">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Region</th>
                    <th className="px-3 py-2.5 text-center font-semibold w-16 text-xs uppercase tracking-wider">Lvl</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-24 text-xs uppercase tracking-wider">km</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-20 text-xs uppercase tracking-wider">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {globalLeaders.map((u, i) => (
                    <tr
                      key={u._id}
                      className={`border-t border-gray-100 transition-colors ${
                        u._id === user?.id ? 'bg-[#2563EB]/5' : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <td className="px-3 py-2.5 text-gray-700 font-semibold tabular-nums">{i + 1}</td>
                      <td className="px-3 py-2.5 text-gray-900 font-medium truncate max-w-[140px]">
                        {u.name}
                        {u._id === user?.id && (
                          <span className="ml-2 text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">You</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs truncate max-w-[120px]">{u.region}</td>
                      <td className="px-3 py-2.5 text-center text-gray-800 font-semibold tabular-nums">{u.level || 1}</td>
                      <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">{u.totalDistance || 0}</td>
                      <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">{u.xp || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </motion.div>
  );
};

export default Leaderboard;