import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Timer, Play, Pause, Square, Zap, Trophy, Flame,
  CheckCircle2, AlertTriangle, XCircle, X
} from 'lucide-react';

const activityTypes = [
  { type: 'running', label: 'Running', icon: '🏃' },
  { type: 'walking', label: 'Walking', icon: '🚶' },
  { type: 'cycling', label: 'Cycling', icon: '🚴' },
  { type: 'workout', label: 'Indoor Workout', icon: '🏋️' },
];

const StartActivityPage = ({ user }) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0); // total elapsed seconds
  const [activeDuration, setActiveDuration] = useState(0); // active seconds
  const [timerId, setTimerId] = useState(null);
  const [demoData, setDemoData] = useState(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Timer effect
  useEffect(() => {
    if (sessionActive && !isPaused) {
      const id = setInterval(() => {
        setDuration(prev => prev + 1);
        setActiveDuration(prev => prev + 1);
      }, 1000);
      setTimerId(id);
      return () => clearInterval(id);
    } else {
      clearInterval(timerId);
    }
  }, [sessionActive, isPaused]);

  // Generate demo raw data based on activity type and duration
  const generateDemoData = (type, activeSeconds) => {
    const durationMin = activeSeconds / 60;
    let speed = 0, hr = 0, cadence = 0, gpsPoints = 0;
    if (type === 'running') {
      speed = 10.2 + Math.random() * 1.5;
      hr = 145 + Math.floor(Math.random() * 15);
      cadence = 170 + Math.floor(Math.random() * 10);
      gpsPoints = 120;
    } else if (type === 'walking') {
      speed = 5.4 + Math.random() * 0.5;
      hr = 100 + Math.floor(Math.random() * 10);
      cadence = 110 + Math.floor(Math.random() * 5);
      gpsPoints = 80;
    } else if (type === 'cycling') {
      speed = 18.5 + Math.random() * 2;
      hr = 130 + Math.floor(Math.random() * 10);
      cadence = 80 + Math.floor(Math.random() * 10);
      gpsPoints = 150;
    } else if (type === 'workout') {
      speed = 0;
      hr = 150 + Math.floor(Math.random() * 10);
      cadence = 0;
      gpsPoints = 0; // no GPS for indoor
    }

    const distance = type === 'workout' ? 0 : Number((speed * durationMin / 60).toFixed(2));
    const calories = type === 'workout'
      ? Math.round(durationMin * 8)
      : Math.round(distance * (type === 'running' ? 60 : type === 'cycling' ? 30 : 45));

    return {
      avgSpeed: speed,
      avgHeartRate: hr,
      cadence,
      gpsPoints,
      sensorQuality: 85 + Math.floor(Math.random() * 15),
      dataQualityScore: 80 + Math.floor(Math.random() * 15),
      pace: type === 'running' || type === 'walking' ? (60 / speed).toFixed(2) : 0,
      calories,
      elevation: type === 'cycling' ? Math.floor(Math.random() * 50) : 0
    };
  };

  const startSession = (type) => {
    setSelectedType(type);
    setSessionActive(true);
    setIsPaused(false);
    setDuration(0);
    setActiveDuration(0);
    setVerificationResult(null);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const handleFinishClick = () => {
    setShowFinishConfirm(true);
  };

  const confirmFinish = async () => {
    setShowFinishConfirm(false);
    setProcessing(true);
    clearInterval(timerId);
    setSessionActive(false);
    setIsPaused(false);

    // Generate demo data
    const rawData = generateDemoData(selectedType, activeDuration);
    setDemoData(rawData);

    const durationMin = Number((activeDuration / 60).toFixed(2));
    const distance = selectedType === 'workout' ? 0 : Number((rawData.avgSpeed * activeDuration / 3600).toFixed(2));

    try {
      // 1. Save activity
      const saveRes = await API.post('/activity', {
        type: selectedType,
        distance: distance > 0 ? distance : 0,
        duration: durationMin,
        activeDuration: durationMin,
        pausedDuration: Number(((duration - activeDuration) / 60).toFixed(2)),
        startTime: new Date(Date.now() - duration * 1000),
        endTime: new Date(),
        rawData
      });
      const activityId = saveRes.data.activity._id;

      // 2. Run verification
      const verifyRes = await API.post(`/verification/run/${activityId}`);

      setVerificationResult({
        ...verifyRes.data,
        activityId,
        rawData,
        distance: distance > 0 ? distance : 0,
        durationMin
      });
    } catch (err) {
      console.error('Error finishing activity', err);
      alert('Activity could not be processed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const cancelFinish = () => {
    setShowFinishConfirm(false);
  };

  const handleDone = () => {
    setVerificationResult(null);
    navigate('/activity');
  };

  const handleViewCommunity = () => {
    setVerificationResult(null);
    navigate('/state-hub');
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // If activity is active
  if (sessionActive) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1e] text-white p-4">
        <h2 className="text-3xl font-bold mb-1 capitalize">{selectedType} Session</h2>
        <p className="text-gray-400 mb-6">DEMO MODE - Simulated sensors</p>

        {/* Timer */}
        <div className="text-7xl font-bold text-blue-500 mb-4">{formatTime(duration)}</div>

        {/* Live metrics (demo) */}
        <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-md">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">Distance</p>
            <p className="text-2xl font-bold">{((activeDuration / 3600) * (selectedType === 'running' ? 10.2 : selectedType === 'cycling' ? 18.5 : selectedType === 'walking' ? 5.4 : 0)).toFixed(2)} km</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">Calories</p>
            <p className="text-2xl font-bold">{Math.round((activeDuration / 60) * (selectedType === 'running' ? 10 : selectedType === 'cycling' ? 6 : 5))} kcal</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">Heart Rate</p>
            <p className="text-2xl font-bold">{selectedType === 'running' ? 145 : selectedType === 'cycling' ? 130 : selectedType === 'walking' ? 100 : 150} BPM</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">Pace/Speed</p>
            <p className="text-2xl font-bold">{selectedType === 'cycling' ? '18.5 km/h' : selectedType === 'walking' ? '11:00 /km' : '5:30 /km'}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <button
            onClick={togglePause}
            className="bg-yellow-500 text-white px-8 py-3 rounded-full flex items-center gap-2 hover:bg-yellow-600"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={handleFinishClick}
            className="bg-blue-500 text-white px-8 py-3 rounded-full flex items-center gap-2 hover:bg-blue-700"
          >
            <Square className="w-5 h-5" /> Finish
          </button>
        </div>

        {/* Finish Confirmation Modal */}
        <AnimatePresence>
          {showFinishConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              onClick={cancelFinish}
            >
              <div className="bg-[#0d1b2a] border border-white/10 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-2">Finish Activity?</h3>
                <p className="text-gray-400 mb-4">Are you sure you want to finish this session?</p>
                <div className="flex gap-3">
                  <button onClick={cancelFinish} className="flex-1 bg-gray-700 text-white py-2 rounded-lg">Continue Activity</button>
                  <button onClick={confirmFinish} className="flex-1 bg-blue-500 text-white py-2 rounded-lg">Finish</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Activity selection
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Start Activity</h1>
      <p className="text-gray-500 mb-6">Select an exercise type to begin.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activityTypes.map(act => (
          <button
            key={act.type}
            onClick={() => startSession(act.type)}
            className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-blue-400 hover:shadow-md transition"
          >
            <span className="text-5xl">{act.icon}</span>
            <span className="text-gray-800 font-semibold">{act.label}</span>
          </button>
        ))}
      </div>

      {/* Completion Result Modal */}
      <AnimatePresence>
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-[#0d1b2a] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full text-white overflow-y-auto max-h-[90vh]">
              {/* Close button */}
              <button onClick={handleDone} className="float-right text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-cyan-400">MoveX Verification Engine</h2>
                {verificationResult.decision === 'VERIFIED' && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">VERIFIED</span>
                )}
                {verificationResult.decision === 'PROBABLE' && (
                  <span className="inline-block mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">PROBABLE</span>
                )}
                {verificationResult.decision === 'INVALID' && (
                  <span className="inline-block mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full">INVALID</span>
                )}
              </div>

              {/* Activity Summary */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <h3 className="font-semibold capitalize">{verificationResult.activity.type}</h3>
                <p className="text-sm text-gray-300">
                  AVS: {verificationResult.avs}/100 • {verificationResult.decision} • {verificationResult.confidence} confidence
                </p>
              </div>

              {/* Rewards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <Zap className="w-5 h-5 text-yellow-400 mx-auto" />
                  <p className="font-bold">+{verificationResult.energyAwarded || 0}</p>
                  <p className="text-xs text-gray-400">Energy</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <Trophy className="w-5 h-5 text-purple-400 mx-auto" />
                  <p className="font-bold">+{verificationResult.xpAwarded || 0}</p>
                  <p className="text-xs text-gray-400">XP</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <Flame className="w-5 h-5 text-orange-400 mx-auto" />
                  <p className="font-bold">+{verificationResult.trophyAwarded ? 1 : 0}</p>
                  <p className="text-xs text-gray-400">Trophies</p>
                </div>
              </div>

              {/* AVS Breakdown */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">AVS Breakdown</h4>
                <div className="space-y-2">
                  {verificationResult.verification?.steps?.slice(0, 5).map(step => (
                    <div key={step.step} className="flex justify-between text-sm">
                      <span className="text-gray-300">{step.name}</span>
                      <span className="text-gray-400">{step.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Contribution */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">Community Contribution</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Community Energy</span>
                  <span className="text-gray-400">+{verificationResult.communityContribution || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Clan Contribution</span>
                  <span className="text-gray-400">+{verificationResult.clanEnergyContribution || 0}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleViewCommunity}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  See Community
                </button>
                <button
                  onClick={handleDone}
                  className="flex-1 bg-blue-500 hover:bg-blue-700 text-white py-2 rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StartActivityPage;