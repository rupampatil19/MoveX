import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import BeginnerDashboard from './pages/BeginnerDashboard';
import ProDashboard from './pages/ProDashboard';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ARSection from './pages/ARSection';
import AnalyticsPage from './pages/AnalyticsPage';
import StartActivityPage from './pages/StartActivityPage';
import ActivityResultPage from './pages/ActivityResultPage';
import ActivityHistoryPage from './pages/ActivityHistoryPage';
import AICoachPage from './pages/AICoachPage';
import GameModesPage from './pages/GameModesPage';
import NotificationsPage from './pages/NotificationsPage';
import RewardsPage from './pages/RewardsPage';
import ClanPage from './pages/ClanPage';
import HowItWorksPage from './pages/HowItWorksPage';
import QuestsPage from './pages/QuestsPage';
import EventsPage from './pages/EventsPage';
import MapPage from './pages/MapPage'; // NEW
import DashboardLayout from './components/layout/DashboardLayout';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('movex_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const logout = () => {
    localStorage.removeItem('movex_token');
    localStorage.removeItem('movex_user');
    setUser(null);
    window.location.href = '/login';
  };

  const DashboardComponent = user?.accountType === 'PRO' ? ProDashboard : BeginnerDashboard;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

        <Route
          path="/*"
          element={
            user ? (
              <DashboardLayout user={user} logout={logout}>
                <Routes>
                  <Route path="/" element={<DashboardComponent user={user} />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/start" element={<StartActivityPage user={user} />} />
                  <Route path="/activity-result/:id" element={<ActivityResultPage />} />
                  <Route path="/activity" element={<ActivityHistoryPage />} />
                  <Route path="/ai-coach" element={<AICoachPage user={user} />} />
                  <Route path="/game-modes" element={<GameModesPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/rewards" element={<RewardsPage />} />
                  <Route path="/clan" element={<ClanPage user={user} />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/quests" element={<QuestsPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/map" element={<MapPage />} /> {/* UPDATED */}
                  <Route path="/leaderboard" element={<Leaderboard user={user} />} />
                  <Route path="/profile" element={<Profile user={user} logout={logout} />} />
                  <Route path="/settings" element={<Settings user={user} />} />
                  <Route path="/ar" element={<ARSection />} />
                  <Route path="/state-hub" element={<div className="text-center text-gray-400">State Hub coming soon</div>} />
                  <Route path="/athlete" element={<div className="text-center text-gray-400">Athlete section coming soon</div>} />
                  <Route path="/store" element={<div className="text-center text-gray-400">Store coming soon</div>} />
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;