import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import BottomNavigation from './BottomNavigation';

const DashboardLayout = ({ user, children, logout }) => {
  const isPro = user?.accountType === 'PRO';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${
      isPro ? 'bg-[#071426] text-[#F1F5F9]' : 'bg-[#F7FAF7] text-gray-800'
    }`}>
      <Sidebar user={user} logout={logout} pro={isPro} />
      <div className="flex-1 md:ml-64 pb-16 md:pb-0">
        <TopHeader user={user} pro={isPro} />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
      <BottomNavigation logout={logout} />
    </div>
  );
};

export default DashboardLayout;