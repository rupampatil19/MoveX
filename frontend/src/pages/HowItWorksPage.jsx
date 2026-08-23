import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import {
  User, Activity, ShieldCheck, Zap, Trophy, TrendingUp, Flame, Gift,
  Users, HeartHandshake, Power, Building, Network, Star, Award
} from 'lucide-react';

const HowItWorksPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get('/movex-system/summary');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;
  if (!data) return <div className="p-6 text-red-500">Failed to load data</div>;

  const { user, recentActivity, verification, community } = data;

  const layer1Stages = [
    { key: 'you', label: 'You', icon: User, value: `${user.name}`, detail: `Level ${user.level} • ${user.xp} XP` },
    { key: 'activity', label: 'Physical Activity', icon: Activity, value: recentActivity ? `${recentActivity.type}` : 'No activity yet', detail: recentActivity ? `${recentActivity.distance} km • ${recentActivity.duration} min` : 'Start your first activity' },
    { key: 'verified', label: 'Verified Activity', icon: ShieldCheck, value: verification ? `${verification.avs}/100 AVS` : 'Not verified', detail: verification ? `${verification.decision} • ${verification.confidence} confidence` : 'Complete an activity to verify' },
    { key: 'energy', label: 'Energy', icon: Zap, value: `${user.energy} ⚡`, detail: recentActivity ? `+${recentActivity.energyAwarded} from last activity` : 'Energy from verified activities' },
    { key: 'trophies', label: 'Trophies', icon: Trophy, value: `${user.trophies.length} 🏆`, detail: user.trophies.join(', ') || 'No trophies yet' },
    { key: 'level', label: 'Level', icon: TrendingUp, value: `Level ${user.level}`, detail: `${user.xp} XP • ${1000 - (user.xp % 1000)} XP to next` },
    { key: 'streak', label: 'Streak / Quests', icon: Flame, value: `${user.streak} Day Streak`, detail: 'Daily Quest: Complete 20 min activity' },
    { key: 'rewards', label: 'Rewards', icon: Gift, value: 'Rewards & Chests', detail: 'Earn rewards through progress' },
  ];

  const layer2Stages = [
    { key: 'users', label: 'Users', icon: Users, value: `${community.membersCount} Members`, detail: `Region: ${community.region}` },
    { key: 'contribute', label: 'Contribute Energy', icon: HeartHandshake, value: `+${community.communityContribution} Energy`, detail: 'Your latest contribution' },
    { key: 'power', label: 'Community Power', icon: Power, value: `${community.totalEnergy} Energy`, detail: `Progress: ${community.powerStationCurrentEnergy}/${community.powerStationRequiredEnergy}` },
    { key: 'station', label: 'Power Station', icon: Building, value: `Level ${community.powerStationLevel}`, detail: `Next upgrade at ${community.powerStationRequiredEnergy} Energy` },
    { key: 'hub', label: 'Power Hub', icon: Network, value: 'City / State / National', detail: 'Connected to regional hub' },
    { key: 'community-level', label: 'Community Level', icon: Star, value: `Level ${community.communityLevel}`, detail: 'Grows with community energy' },
    { key: 'challenges', label: 'Challenges & Rewards', icon: Award, value: 'New challenges', detail: 'Unlock when community levels up' },
  ];

  const progressPercent = community.powerStationRequiredEnergy > 0
    ? Math.min((community.powerStationCurrentEnergy / community.powerStationRequiredEnergy) * 100, 100)
    : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">How MoveX Works</h1>

      <section>
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Layer 1 — Individual Flow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {layer1Stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.key}
                onClick={() => setSelectedStage(stage)}
                className={`bg-white border p-4 rounded-2xl text-left transition shadow-sm ${
                  selectedStage?.key === stage.key ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-blue-700" />
                  <span className="text-gray-800 font-semibold">{stage.label}</span>
                </div>
                <p className="text-gray-800 font-bold">{stage.value}</p>
                <p className="text-gray-500 text-sm mt-1">{stage.detail}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-gray-800 font-semibold mb-1">Explained in Simple Words 💡</h3>
          <p className="text-gray-500 text-sm">You do a physical activity, MoveX verifies it, awards Energy, and you progress through trophies, levels, streaks, and rewards.</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Layer 2 — Community Flow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {layer2Stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.key}
                onClick={() => setSelectedStage(stage)}
                className={`bg-white border p-4 rounded-2xl text-left transition shadow-sm ${
                  selectedStage?.key === stage.key ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-800 font-semibold">{stage.label}</span>
                </div>
                <p className="text-gray-800 font-bold">{stage.value}</p>
                <p className="text-gray-500 text-sm mt-1">{stage.detail}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Power Station Progress</span>
            <span>{community.powerStationCurrentEnergy} / {community.powerStationRequiredEnergy} Energy</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="bg-blue-400 h-3 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-gray-500 text-sm mt-2">Your contribution: +{community.communityContribution} Energy</p>
        </div>
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-gray-800 font-semibold mb-1">Explained in Simple Words 💡</h3>
          <p className="text-gray-500 text-sm">Your Energy helps your community upgrade its Power Station, unlocking new challenges and rewards for everyone.</p>
        </div>
      </section>

      {selectedStage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStage(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedStage.label}</h3>
            <p className="text-gray-700">{selectedStage.value}</p>
            <p className="text-gray-500 text-sm mt-1">{selectedStage.detail}</p>
            <button onClick={() => setSelectedStage(null)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HowItWorksPage;