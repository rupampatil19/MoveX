import { useState, useEffect, useRef } from 'react';
import API from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Zap, Trophy, Flame, X, CheckCircle2, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';

const activityTypes = [
  { type: 'running', label: 'Running', icon: '🏃' },
  { type: 'walking', label: 'Walking', icon: '🚶' },
  { type: 'cycling', label: 'Cycling', icon: '🚴' },
  { type: 'workout', label: 'Indoor Workout', icon: '🏋️' },
];

const StartActivityPage = ({ user }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (sessionActive && !isPaused) {
      timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive, isPaused]);

  useEffect(() => {
    if (report) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [report]);

  const startSession = (type) => {
    setSelectedType(type);
    setSessionActive(true);
    setIsPaused(false);
    setDuration(0);
    setReport(null);
  };

  const togglePause = () => setIsPaused(prev => !prev);

  const cancelSession = () => {
    clearInterval(timerRef.current);
    setSessionActive(false);
    setSelectedType(null);
    setDuration(0);
    setIsPaused(false);
  };

  const handleFinish = async () => {
    if (processing) return;
    setProcessing(true);
    clearInterval(timerRef.current);
    setSessionActive(false);
    setIsPaused(false);

    const activeSeconds = duration;
    const durationMin = Number((activeSeconds / 60).toFixed(2));
    const speedKmh = selectedType === 'running' ? 10.2 : selectedType === 'cycling' ? 18.5 : selectedType === 'walking' ? 5.4 : 0;
    const distance = selectedType === 'workout' ? 0 : Number((speedKmh * activeSeconds / 3600).toFixed(2));

    const rawData = {
      demo: true, // Mark as demo for fast verification
      avgSpeed: speedKmh,
      avgHeartRate: selectedType === 'running' ? 145 : selectedType === 'cycling' ? 130 : selectedType === 'walking' ? 100 : 150,
      cadence: selectedType === 'running' ? 170 : selectedType === 'cycling' ? 80 : selectedType === 'walking' ? 110 : 0,
      gpsPoints: selectedType === 'workout' ? 0 : 120,
      sensorQuality: 85,
      dataQualityScore: 80,
      duration: durationMin,
    };

    try {
      const saveRes = await API.post('/activity', { type: selectedType, distance, duration: durationMin, rawData });
      const activityId = saveRes.data.activity._id;

      const verifyRes = await API.post(`/verification/run/${activityId}`);
      const data = verifyRes.data;

      setReport({
        activityId,
        activityType: selectedType,
        distance,
        duration: durationMin,
        avs: data.avs,
        tps: data.tps || data.avs,
        scoreBreakdown: data.scoreBreakdown || {},
        decision: data.decision,
        confidence: data.confidence,
        energy: data.energyAwarded || 0,
        xp: data.xpAwarded || 0,
        trophy: data.trophyName || null,
        streak: data.user?.streak || 0,
      });
    } catch (err) {
      console.error('Activity processing error:', err);
      alert(err.response?.data?.msg || 'Activity could not be processed. Please try again.');
    } finally {
      setProcessing(false);
      setSelectedType(null);
      setDuration(0);
    }
  };

  const handleDone = () => setReport(null);

  const getStepIcon = (status) => {
    if (status === 'GREEN') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'ORANGE') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-[#F7FAF7]">
      {sessionActive ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-1 capitalize">{selectedType} Session</h2>
          <p className="text-gray-500 mb-6">Demo Mode - Simulated sensors</p>
          <div className="text-6xl font-bold text-[#2563EB] mb-4">
            {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
          </div>
          <div className="flex gap-4">
            <button onClick={togglePause} className="bg-yellow-500 text-white px-8 py-3 rounded-full">{isPaused ? 'Resume' : 'Pause'}</button>
            <button onClick={cancelSession} className="bg-red-500 text-white px-6 py-3 rounded-full">Cancel</button>
            <button onClick={handleFinish} disabled={processing} className="bg-[#2563EB] text-white px-8 py-3 rounded-full">{processing ? 'Processing...' : 'Finish'}</button>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Start Activity</h1>
          <p className="text-gray-500 mb-6">Select an exercise type to begin.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activityTypes.map(act => (
              <button key={act.type} onClick={() => startSession(act.type)} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-[#2563EB] transition">
                <span className="text-5xl">{act.icon}</span>
                <span className="text-gray-800 font-semibold">{act.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {report && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleDone}>
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
              <button onClick={handleDone} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Activity Report</h2>
              <p className="text-sm text-gray-500 capitalize mb-4">{report.activityType} • {report.distance} km • {report.duration} min</p>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-3"><span className="text-gray-700">AVS</span><span className="text-lg font-bold text-[#2563EB]">{report.avs}/100</span></div>
                <div className="flex justify-between items-center mb-3"><span className="text-gray-700">TPS</span><span className="text-lg font-bold text-[#2563EB]">{report.tps}/100</span></div>
                <div className="flex justify-between items-center mb-3"><span className="text-gray-700">Decision</span><span className="font-semibold text-gray-800">{report.decision}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-700">Confidence</span><span className="font-semibold text-gray-800">{report.confidence}</span></div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-yellow-50 rounded-xl p-3 text-center"><Zap className="w-5 h-5 text-yellow-500 mx-auto" /><p className="font-bold text-gray-800">+{report.energy}</p><p className="text-xs text-gray-500">Energy</p></div>
                <div className="bg-purple-50 rounded-xl p-3 text-center"><Trophy className="w-5 h-5 text-purple-500 mx-auto" /><p className="font-bold text-gray-800">+{report.xp}</p><p className="text-xs text-gray-500">XP</p></div>
                <div className="bg-orange-50 rounded-xl p-3 text-center"><Flame className="w-5 h-5 text-orange-500 mx-auto" /><p className="font-bold text-gray-800">{report.streak} Day</p><p className="text-xs text-gray-500">Streak</p></div>
              </div>

              <button onClick={handleDone} className="w-full bg-[#2563EB] text-white py-3 rounded-lg hover:bg-[#1D4ED8] transition">Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartActivityPage;