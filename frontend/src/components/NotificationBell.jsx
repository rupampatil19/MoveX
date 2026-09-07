import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import API from '../api';
import io from 'socket.io-client';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchNotifications();
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    setSocket(newSocket);

    const userId = JSON.parse(localStorage.getItem('movex_user'))?.id;
    if (userId) {
      newSocket.emit('register', userId);
      newSocket.on('notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => newSocket.disconnect();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.slice(0, 5));
      const unread = await API.get('/notifications/unread');
      setUnreadCount(unread.data.count);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = () => {
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button onClick={handleToggle} className="relative p-2 rounded-full hover:bg-gray-100">
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-[#2563EB]">Mark all read</button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-3 text-sm text-gray-500">No notifications</p>
            ) : (
              notifications.map(notif => (
                <Link
                  key={notif._id}
                  to={notif.actionRoute || '/notifications'}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2 p-3 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                    <p className="text-xs text-gray-500">{notif.message}</p>
                  </div>
                  {!notif.read && <span className="w-2 h-2 bg-[#2563EB] rounded-full mt-1"></span>}
                </Link>
              ))
            )}
          </div>
          <Link to="/notifications" className="block text-center p-2 text-sm text-[#2563EB] border-t border-gray-100">
            View All
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;