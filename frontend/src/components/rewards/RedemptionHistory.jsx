import { useEffect, useState } from 'react';
import API from '../../api';

const RedemptionHistory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/rewards/history');
        setItems(data || []);
      } catch (err) {
        console.error('history error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading history…</p>;
  if (items.length === 0) return <p className="text-sm text-gray-500">No redemptions yet.</p>;

  return (
    <div className="divide-y divide-gray-100">
      {items.map(i => (
        <div key={i._id} className="py-3 flex justify-between items-center gap-3">
          <div>
            <p className="font-semibold text-gray-900">{i.rewardName}</p>
            <p className="text-xs text-gray-500">
              {i.rewardCategory} · {new Date(i.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">−{i.trophyCost} 🏆</p>
            <p className="text-xs text-green-600">{i.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RedemptionHistory;