import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Users, Search, Shield, Crown, Activity, Zap, Trophy, LogOut, X, Check } from 'lucide-react';

const ClanPage = ({ user }) => {
  const [myClan, setMyClan] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [publicClans, setPublicClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '🏰', region: user.region || 'Kothrud', privacy: 'PUBLIC', maxMembers: 50 });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [myRes, publicRes] = await Promise.all([
        API.get('/clans/my'),
        API.get('/clans')
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
    setError('');
    try {
      await API.post('/clans/leave');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to leave clan');
    }
  };

  const filteredClans = publicClans.filter(clan =>
    clan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-6 text-gray-700">Loading clan...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Clan</h1>

      {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg">{error}</div>}

      {/* My Clan Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">My Clan</h2>
        {myClan ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{myClan.icon || '🏰'}</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{myClan.name}</h3>
                <p className="text-gray-500">Level {myClan.level} • {myClan.privacy} • {myClan.region}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-gray-500 text-sm">Members</p>
                <p className="text-gray-800 font-bold">{members.length} / {myClan.maxMembers}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-gray-500 text-sm">Clan Energy</p>
                <p className="text-gray-800 font-bold">{myClan.energy || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-gray-500 text-sm">Clan XP</p>
                <p className="text-gray-800 font-bold">{myClan.xp || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-gray-500 text-sm">Your Role</p>
                <p className="text-gray-800 font-bold">{myRole}</p>
              </div>
            </div>
            <p className="text-gray-600 mt-4">{myClan.description}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleLeaveClan}
                className="bg-red-50 text-red-500 px-4 py-2 rounded-lg hover:bg-red-100"
              >
                Leave Clan
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
            <p className="text-gray-500">You are not in a clan yet.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Clan
            </button>
          </div>
        )}
      </div>

      {/* Create Clan Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateForm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Clan</h2>
            <form onSubmit={handleCreateClan} className="space-y-3">
              <input
                placeholder="Clan Name"
                required
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg"
              />
              <input
                placeholder="Description"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Icon emoji"
                  value={form.icon}
                  onChange={e => setForm({...form, icon: e.target.value})}
                  className="p-3 border border-gray-200 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Max Members"
                  value={form.maxMembers}
                  onChange={e => setForm({...form, maxMembers: e.target.value})}
                  className="p-3 border border-gray-200 rounded-lg"
                />
              </div>
              <select
                value={form.region}
                onChange={e => setForm({...form, region: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg"
              >
                {['Kothrud','Hinjewadi','Baner','Viman Nagar','Hadapsar','Shivaji Nagar','Pimpri'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <select
                value={form.privacy}
                onChange={e => setForm({...form, privacy: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
              <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700">
                Create Clan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Public Clan Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Join Public Clan</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search clans..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 p-3 border border-gray-200 rounded-lg"
          />
        </div>
        {filteredClans.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500">
            No public clans found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClans.map(clan => (
              <div key={clan._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{clan.icon || '🏰'}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{clan.name}</h3>
                    <p className="text-sm text-gray-500">{clan.region} • {clan.accountType}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{clan.description}</p>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span>Level {clan.level}</span>
                  <span>{clan.members || 0} / {clan.maxMembers}</span>
                  <span>⚡ {clan.energy || 0} Energy</span>
                  <span>⭐ {clan.xp || 0} XP</span>
                </div>
                <button
                  onClick={() => handleJoinClan(clan._id)}
                  className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ClanPage;