import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import { Trophy, Loader2, MapPin } from 'lucide-react';
import {
  getCityForRegion,
  getCityById,
  getStateById,
  getRegionsForCity,
  getCitiesForState,
} from '../data/geoHierarchy';

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
          breadcrumb: [city?.name, state?.name].filter(Boolean).join(' • '),
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
        breadcrumb: [city?.name, state?.name].filter(Boolean).join(' • '),
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

  if (loading && athletes.length === 0 && globalLeaders.length === 0 && regionsRanked.length === 0) {
    return (
      <div className="p-6 text-gray-700 flex items-center gap-2">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" /> Loading…
      </div>
    );
  }

  const showRegionColumn = context.level !== 'region';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-3 sm:px-4 pt-2 pb-28 space-y-4 sm:space-y-5"
    >
      {/* Header */}
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
            <MapPin className="w-3 h-3" />
            <span>{breadcrumb}</span>
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-[#2563EB]" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {context.level !== 'global' && (
          <button
            onClick={() => setTab('athletes')}
            className={`px-3 sm:px-4 py-2 rounded-full transition text-sm sm:text-base font-medium ${
              tab === 'athletes'
                ? 'bg-[#2563EB] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Top Athletes
          </button>
        )}
        {context.level !== 'global' && (
          <button
            onClick={() => setTab('regions')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition text-xs sm:text-sm font-medium ${
              tab === 'regions'
                ? 'bg-[#2563EB] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Regions Ranking
          </button>
        )}
        <button
          onClick={() => setTab('global')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition text-xs sm:text-sm font-medium ${
            tab === 'global'
              ? 'bg-[#2563EB] text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Global
        </button>
      </div>

      {/* Region / City pills */}
      {scopeSelector && scopeSelector.items.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">
            {scopeSelector.label}:
          </span>
          {scopeSelector.items.map((item) => {
            const isCurrent = scopeSelector.current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scopeSelector.onPick(item.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* ---- Top Athletes ---- */}
      {tab === 'athletes' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm sm:text-base table-fixed sm:table-auto">
            <thead>
              <tr className="bg-[#2563EB] text-white">
                <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-left font-semibold w-10">#</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-left font-semibold">Name</th>
                {showRegionColumn && (
                  <th className="px-2 py-2 sm:px-3 sm:py-3 text-left font-semibold">Region</th>
                )}
                <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-center font-semibold w-14">
                  Lvl
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold">
                  ⚡
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold">
                  ⭐
                </th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((u, i) => (
                <tr
                  key={u._id}
                  className={`border-t border-gray-100 ${
                    u._id === user?.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-gray-700 font-medium">
                    {i + 1}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-gray-800 font-medium truncate">
                    {u.name}
                  </td>
                  {showRegionColumn && (
                    <td className="px-2 py-2 sm:px-3 sm:py-3 text-gray-600 truncate">
                      {u.region}
                    </td>
                  )}
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-gray-800 font-semibold">
                    {u.level || 1}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-yellow-600 font-medium">
                    {(u.energy || 0).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-gray-700">
                    {u.xp || 0}
                  </td>
                </tr>
              ))}
              {athletes.length === 0 && (
                <tr>
                  <td
                    colSpan={showRegionColumn ? 6 : 5}
                    className="px-3 py-6 text-center text-gray-500 text-base"
                  >
                    No athletes in this area yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Regions Ranking ---- */}
      {tab === 'regions' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs sm:text-sm table-fixed sm:table-auto">
            <thead>
              <tr className="bg-[#2563EB] text-white">
                <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-left font-semibold w-12">#</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-left font-semibold">Region</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold w-14">
                  Lvl
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold">
                  ⚡ Energy
                </th>
              </tr>
            </thead>
            <tbody>
              {regionsRanked.map((r, i) => (
                <tr key={r.region || r.city || r.id || i} className="border-t border-gray-100">
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-gray-700 font-medium">
                    {i + 1}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-gray-800 font-medium truncate">
                    {r.region || r.name}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-gray-800">
                    {r.powerStationLevel || r.communityLevel || 1}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-gray-700">
                    {(r.totalEnergy || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {regionsRanked.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-gray-500 text-sm">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Global ---- */}
      {tab === 'global' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs sm:text-sm table-fixed sm:table-auto">
            <thead>
              <tr className="bg-[#2563EB] text-white">
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-left font-semibold w-10">#</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-left font-semibold">Name</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-left font-semibold">Region</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold w-12">
                  Lvl
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold">km</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold">⭐</th>
              </tr>
            </thead>
            <tbody>
              {globalLeaders.map((u, i) => (
                <tr
                  key={u._id}
                  className={`border-t border-gray-100 ${
                    u._id === user?.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-gray-700 font-medium">
                    {i + 1}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-gray-800 font-medium truncate">
                    {u.name}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-gray-600 truncate">
                    {u.region}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-gray-800 font-semibold">
                    {u.level || 1}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-gray-700">
                    {u.totalDistance || 0}
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-gray-700">
                    {u.xp || 0}
                  </td>
                </tr>
              ))}
              {globalLeaders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-gray-500 text-sm">
                    No global data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default Leaderboard;