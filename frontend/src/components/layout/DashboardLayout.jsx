import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import BottomNavigation from './BottomNavigation';
import API from '../../api';

const DashboardLayout = ({ user, children, logout }) => {
  const location = useLocation();
  const [userStats, setUserStats] = useState(user);

  useEffect(() => {
    let isMounted = true;
    const fetchUserStats = async () => {
      try {
        const res = await API.get('/auth/me');
        if (isMounted && res.data) {
          setUserStats(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch user stats for header:', err);
      }
    };

    fetchUserStats();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, user?.id]);

  return (
    <div className="glass-page-bg text-gray-800 flex flex-col md:flex-row">
      <Sidebar user={userStats} logout={logout} pro={user?.accountType === 'PRO'} />
      <div className="flex-1 md:ml-[17.5rem] pb-28 md:pb-4">
        <TopHeader user={userStats} pro={user?.accountType === 'PRO'} />
        <main className="p-3 md:p-4">
          {children}
        </main>
      </div>
      <BottomNavigation user={userStats} logout={logout} />
    </div>
  );
};

export default DashboardLayout;