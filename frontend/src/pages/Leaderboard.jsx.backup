import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Trophy, Users, Loader2, AlertCircle } from 'lucide-react';

const regions = ['All', 'Kothrud', 'Hinjewadi', 'Baner', 'Viman Nagar', 'Hadapsar', 'Shivaji Nagar', 'Pimpri'];
const Leaderboard = ({ user }) => {
  const [tab, setTab] = useState('GLOBAL');
  const [leaders, setLeaders] = useState([]);
  const [regionalAthletes, setRegionalAthletes] = useState([]);
  const [regionalRegions, setRegionalRegions] = useState([]);
  const [region, setRegion] = useState(user.region || 'Kothrud');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tab === 'GLOBAL') fetchGlobalLeaderboard();
    else if (tab === 'REGIONAL_ATHLETES') fetchRegionalAthletes();
    else if (tab === 'REGIONAL_REGIONS') fetchRegionalRegions();
  }, [tab, region]);

  const fetchGlobalLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/leaderboard');
      setLeaders(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Global leaderboard error:', err);
      setError('Unable to load global leaderboard');
      setLoading(false);
    }
  };

  const fetchRegionalAthletes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use /leaderboard/region/:region to get ALL registered users
      const url = region === 'All' ? '/leaderboard' : `/leaderboard/region/${region}`;
      const res = await API.get(url);
      setRegionalAthletes(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Regional athletes error:', err);
      setError('Unable to load regional athletes');
      setLoading(false);
    }
  };

  const fetchRegionalRegions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/community/all');
      setRegionalRegions(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Regional regions error:', err);
      setError('Unable to load regional rankings');
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-700 flex items-center gap-2"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /> Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-blue-700" />
        <h1 className="text-3xl font-bold text-gray-800">Leaderboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'GLOBAL', label: 'Global' },
          { key: 'REGIONAL_ATHLETES', label: 'Regional Athletes' },
          { key: 'REGIONAL_REGIONS', label: 'Region vs Region' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full transition ${
              tab === t.key ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Region selector for regional athletes */}
      {tab === 'REGIONAL_ATHLETES' && (
        <div className="flex flex-wrap gap-2">
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                region === r ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {tab === 'GLOBAL' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Region</th>
                <th className="p-3 text-center">Level</th>
                <th className="p-3 text-center">Distance (km)</th>
                <th className="p-3 text-center">XP</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((u, i) => (
                <tr key={u._id} className={`border-t border-gray-100 ${u._id === user.id ? 'bg-blue-50' : ''}`}>
                  <td className="p-3 text-gray-700">{i + 1}</td>
                  <td className="p-3 text-gray-800 font-medium">{u.name}</td>
                  <td className="p-3 text-gray-600">{u.region}</td>
                  <td className="p-3 text-center text-gray-800">{u.level}</td>
                  <td className="p-3 text-center text-gray-700">{u.totalDistance}</td>
                  <td className="p-3 text-center text-gray-700">{u.xp}</td>
                </tr>
              ))}
              {leaders.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">No athletes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'REGIONAL_ATHLETES' && (
        <>
          <h2 className="text-xl font-semibold text-gray-800">Top Athletes in {region}</h2>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-500 text-white">
                  <th className="p-3 text-left">Rank</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Region</th>
                  <th className="p-3 text-center">Level</th>
                  <th className="p-3 text-center">Energy</th>
                  <th className="p-3 text-center">Trophies</th>
                  <th className="p-3 text-center">XP</th>
                </tr>
              </thead>
              <tbody>
                {regionalAthletes.map((u, i) => (
                  <tr key={u._id} className={`border-t border-gray-100 ${u._id === user.id ? 'bg-blue-50' : ''}`}>
                    <td className="p-3 text-gray-700">{i + 1}</td>
                    <td className="p-3 text-gray-800 font-medium">{u.name}</td>
                    <td className="p-3 text-gray-600">{u.region}</td>
                    <td className="p-3 text-center text-gray-800">{u.level}</td>
                    <td className="p-3 text-center text-yellow-600">{u.energy || 0}</td>
                    <td className="p-3 text-center text-purple-600">{u.trophies ? u.trophies.length : 0}</td>
                    <td className="p-3 text-center text-gray-700">{u.xp}</td>
                  </tr>
                ))}
                {regionalAthletes.length === 0 && (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">No athletes registered in {region} yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'REGIONAL_REGIONS' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-left">Region</th>
                <th className="p-3 text-center">Level</th>
                <th className="p-3 text-center">Total Energy</th>
              </tr>
            </thead>
            <tbody>
              {regionalRegions.map((r, i) => (
                <tr key={r.region} className="border-t border-gray-100">
                  <td className="p-3 text-gray-700">{i + 1}</td>
                  <td className="p-3 text-gray-800 font-medium">{r.region}</td>
                  <td className="p-3 text-center text-gray-800">{r.powerStationLevel || r.communityLevel || 1}</td>
                  <td className="p-3 text-center text-gray-700">{r.totalEnergy ? r.totalEnergy.toLocaleString() : '0'}</td>
                </tr>
              ))}
              {regionalRegions.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No regional data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default Leaderboard;