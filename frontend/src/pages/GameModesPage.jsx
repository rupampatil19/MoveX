import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Castle, Leaf, Lock } from 'lucide-react';

const GameModesPage = () => {
  const [currentMode, setCurrentMode] = useState('CLASSIC');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMode();
  }, []);

  const fetchMode = async () => {
    try {
      const res = await API.get('/game-mode');
      setCurrentMode(res.data.mode);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const selectMode = async (mode) => {
    try {
      await API.post('/game-mode/select', { mode });
      setCurrentMode(mode);
      alert(`Mode switched to ${mode}`);
    } catch (err) {
      console.error(err);
      alert('Failed to switch mode');
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Game Modes</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`bg-white border ${currentMode === 'CLASSIC' ? 'border-blue-500' : 'border-gray-200'} rounded-2xl p-6 shadow-sm`}>
          <Castle className="w-8 h-8 text-blue-700" />
          <h2 className="text-xl font-bold text-gray-800 mt-2">Classic Mode</h2>
          <p className="text-gray-500 text-sm">Balanced • Social • Competitive</p>
          <button
            onClick={() => selectMode('CLASSIC')}
            className={`mt-4 w-full py-2 rounded-lg ${currentMode === 'CLASSIC' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {currentMode === 'CLASSIC' ? 'Active' : 'Select Classic'}
          </button>
        </div>
        <div className={`bg-white border ${currentMode === 'FOCUS' ? 'border-blue-500' : 'border-gray-200'} rounded-2xl p-6 shadow-sm`}>
          <Leaf className="w-8 h-8 text-blue-700" />
          <h2 className="text-xl font-bold text-gray-800 mt-2">Focus Mode</h2>
          <p className="text-gray-500 text-sm">Personal • Peaceful • Progress</p>
          <button
            onClick={() => selectMode('FOCUS')}
            className={`mt-4 w-full py-2 rounded-lg ${currentMode === 'FOCUS' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {currentMode === 'FOCUS' ? 'Active' : 'Select Focus'}
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm opacity-50">
          <Lock className="w-8 h-8 text-gray-400" />
          <h2 className="text-xl font-bold text-gray-800 mt-2">Development Mode</h2>
          <p className="text-gray-500 text-sm">Coming Soon</p>
          <button disabled className="mt-4 w-full py-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">Locked</button>
        </div>
      </div>
    </motion.div>
  );
};

export default GameModesPage;