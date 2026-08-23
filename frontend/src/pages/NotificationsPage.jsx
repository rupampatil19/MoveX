import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, AlertTriangle, Zap, Users, Gift, Flame } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await API.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'ALERT': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'MOTIVATIONAL': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'SOCIAL': return <Users className="w-5 h-5 text-blue-500" />;
      case 'OPPORTUNITY': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'REMINDER': return <Flame className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading notifications...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
        <button onClick={markAllRead} className="text-sm text-blue-700 hover:text-blue-800">Mark all as read</button>
      </div>
      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No notifications yet.</div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div key={notif._id} className={`bg-white border ${notif.read ? 'border-gray-100' : 'border-blue-200'} rounded-xl p-4 flex items-start gap-3 shadow-sm`}>
              {getIcon(notif.type)}
              <div className="flex-1">
                <h3 className="text-gray-800 font-semibold">{notif.title}</h3>
                <p className="text-gray-500 text-sm">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-1">
                {!notif.read && (
                  <button onClick={() => markAsRead(notif._id)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><Check className="w-4 h-4" /></button>
                )}
                <button onClick={() => deleteNotification(notif._id)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default NotificationsPage;