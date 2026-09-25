import { useEffect, useState, useCallback } from 'react';
import API from '../../api';

const MyRewardsList = ({ onRefresh }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/rewards/my-rewards');
      setItems(data || []);
    } catch (err) {
      console.error('my-rewards error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEquip = async (id, equip) => {
    try {
      await API.post('/rewards/equip', { inventoryId: id, equip });
      await load();
      onRefresh?.();
    } catch (err) {
      alert('Could not update equip state.');
    }
  };

  const handleActivate = async (id) => {
    try {
      await API.post('/rewards/activate-boost', { inventoryId: id });
      await load();
    } catch (err) {
      alert('Could not activate boost.');
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading your rewards…</p>;
  if (items.length === 0) return <p className="text-sm text-gray-500">No rewards yet. Redeem your first one!</p>;

  const now = Date.now();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map(item => {
        const reward = item.rewardId;
        if (!reward) return null;
        const isBoost = reward.category === 'BOOST';
        const isCosmetic = reward.category === 'COSMETIC';
        const active = item.expiresAt && new Date(item.expiresAt).getTime() > now;
        const remainingMs = item.expiresAt ? new Date(item.expiresAt).getTime() - now : 0;
        const hours = Math.floor(remainingMs / 3600000);
        const minutes = Math.floor((remainingMs % 3600000) / 60000);

        return (
          <div key={item._id} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3">
            <div className="text-3xl">
              {reward.iconEmoji || reward.icon || '🎁'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 leading-tight">{reward.name}</p>
              <p className="text-xs text-gray-500 mt-1">{reward.category}</p>

              {isBoost && active && (
                <p className="text-xs text-green-600 font-semibold mt-1">
                  ACTIVE · {hours}h {minutes}m remaining
                </p>
              )}
              {isBoost && !item.activatedAt && (
                <button
                  onClick={() => handleActivate(item._id)}
                  className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-semibold"
                >
                  Activate
                </button>
              )}

              {isCosmetic && (
                <button
                  onClick={() => handleEquip(item._id, !item.equipped)}
                  className={`mt-2 text-xs px-3 py-1.5 rounded-lg font-semibold ${
                    item.equipped
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.equipped ? '✓ Equipped' : 'Equip'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyRewardsList;