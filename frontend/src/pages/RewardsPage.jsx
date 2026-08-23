import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';

const RewardsPage = () => {
  const [catalog, setCatalog] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, invRes] = await Promise.all([
        API.get('/rewards/catalog'),
        API.get('/rewards/inventory')
      ]);
      setCatalog(catRes.data);
      setInventory(invRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const claimReward = async (rewardId) => {
    try {
      await API.post(`/rewards/${rewardId}/claim`);
      alert('Reward claimed successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to claim reward');
    }
  };

  const rarityColor = {
    COMMON: 'bg-gray-400',
    UNCOMMON: 'bg-blue-400',
    RARE: 'bg-blue-400',
    EPIC: 'bg-purple-400',
    LEGENDARY: 'bg-yellow-400'
  };

  if (loading) return <div className="p-6 text-gray-700">Loading rewards...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Rewards</h1>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">My Inventory</h2>
        {inventory.length === 0 ? (
          <div className="text-gray-500">No rewards earned yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {inventory.map(item => (
              <div key={item._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="text-3xl mb-2">{item.rewardId?.icon || '🎁'}</div>
                <p className="text-gray-800 font-semibold">{item.rewardId?.name}</p>
                <p className="text-xs text-gray-500">{item.rewardId?.description}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs text-white ${rarityColor[item.rewardId?.rarity] || 'bg-gray-400'}`}>{item.rewardId?.rarity}</span>
                <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Reward Catalog</h2>
        {catalog.length === 0 ? (
          <div className="text-gray-500">No rewards available.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {catalog.map(reward => (
              <div key={reward._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="text-3xl mb-2">{reward.icon || '🎁'}</div>
                <p className="text-gray-800 font-semibold">{reward.name}</p>
                <p className="text-xs text-gray-500">{reward.description}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs text-white ${rarityColor[reward.rarity] || 'bg-gray-400'}`}>{reward.rarity}</span>
                <button onClick={() => claimReward(reward._id)} className="mt-3 w-full bg-blue-500 hover:bg-blue-700 text-white py-1 rounded-lg text-sm">Claim</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={async () => {
          try {
            await API.post('/rewards/seed-demo');
            alert('Demo rewards seeded!');
            fetchData();
          } catch (err) {
            alert('Demo rewards already seeded or failed');
          }
        }}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
      >
        Seed Demo Rewards
      </button>
    </motion.div>
  );
};

export default RewardsPage;