import { useState, useEffect, useRef } from 'react';
import API from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Zap, Trophy, Flame, X, CheckCircle2, AlertTriangle, XCircle,
  MapPin, Users,
} from 'lucide-react';

const activityTypes = [
  { type: 'running', label: 'Running',        icon: '🏃', description: 'GPS + motion + duration' },
  { type: 'walking', label: 'Walking',        icon: '🚶', description: 'GPS + motion + duration' },
  { type: 'cycling', label: 'Cycling',        icon: '🚴', description: 'GPS + speed/motion + duration' },
  { type: 'workout', label: 'Indoor Workout', icon: '🏋️', description: 'Motion/sensor + duration' },
];

const StartActivityPage = ({ user }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const [progressStage, setProgressStage] = useState('');
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
    setErrorState(null);
    setProgressStage('');
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
    setProgressStage('Saving activity…');
    clearInterval(timerRef.current);
    setSessionActive(false);
    setIsPaused(false);

    const activeSeconds = duration;
    const durationMin = Number((activeSeconds / 60).toFixed(2));
    const speedKmh =
      selectedType === 'running' ? 10.2 :
      selectedType === 'cycling' ? 18.5 :
      selectedType === 'walking' ? 5.4 : 0;
    const distance =
      selectedType === 'workout' ? 0 : Number((speedKmh * activeSeconds / 3600).toFixed(2));

    const rawData = {
      demo: true,
      avgSpeed: speedKmh,
      avgHeartRate:
        selectedType === 'running' ? 145 :
        selectedType === 'cycling' ? 130 :
        selectedType === 'walking' ? 100 : 150,
      cadence:
        selectedType === 'running' ? 170 :
        selectedType === 'cycling' ? 80 :
        selectedType === 'walking' ? 110 : 0,
      gpsPoints: selectedType === 'workout' ? 0 : 120,
      sensorQuality: 85,
      dataQualityScore: 80,
      duration: durationMin,
    };

    try {
      const saveRes = await API.post('/activity', {
        type: selectedType,
        distance,
        duration: durationMin,
        rawData,
      });
      const activityId = saveRes.data?.activity?._id;
      if (!activityId) throw new Error('Backend did not return an activity id');

      setProgressStage('Running verification…');
      const verifyRes = await API.post(`/verification/run/${activityId}`);
      const data = verifyRes.data;

      setProgressStage('Preparing report…');
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
        steps: data.verification?.steps || [],
        community: data.community || null,
        clanEnergy: data.clanEnergyContribution || 0,
        clanXP: data.clanXPContribution || 0,
      });
    } catch (err) {
      const status = err.response?.status;
      const body = err.response?.data;
      const detail =
        body?.msg ||
        body?.error ||
        err.message ||
        'Unknown error';

      console.error('=== ACTIVITY PROCESSING FAILED ===');
      console.error('HTTP status:', status);
      console.error('Response body:', body);
      console.error('Full error:', err);

      setErrorState({
        title: "Activity couldn't be processed",
        message: "We couldn't save this activity. Your activity was not awarded rewards.",
        detail,
      });
    } finally {
      setProcessing(false);
      setProgressStage('');
    }
  };

  const handleDone = () => {
    setReport(null);
    setSelectedType(null);
    setDuration(0);
  };

  const handleTryAgain = () => {
    setErrorState(null);
    setSelectedType(null);
    setDuration(0);
  };

  // ---- Processing splash ----
  if (processing) {
    return (
      <div className="min-h-screen bg-[#F7FAF7] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-lg font-semibold text-gray-800">{progressStage || 'Processing…'}</p>
        <p className="text-sm text-gray-500 mt-2">This usually takes a few seconds.</p>
      </div>
    );
  }

  // ---- Report popup ----
  if (report) {
    const decision = (report.decision || '').toUpperCase();
    const isVerified = decision === 'VERIFIED';
    const isProbable = decision === 'PROBABLE';

    return (
      <div className="min-h-screen bg-[#F7FAF7] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 22 }}
          className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[92vh] overflow-y-auto"
        >
          <div className="text-center mb-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">MoveX Activity Report</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              {isVerified && <CheckCircle2 className="w-8 h-8 text-green-500" />}
              {isProbable && <AlertTriangle className="w-8 h-8 text-yellow-500" />}
              {!isVerified && !isProbable && <XCircle className="w-8 h-8 text-red-500" />}
              <span className={`text-2xl font-extrabold ${isVerified ? 'text-green-600' : isProbable ? 'text-yellow-600' : 'text-red-600'}`}>
                {decision || 'RECORDED'}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-800 mt-3 capitalize">{report.activityType}</p>
            <p className="text-sm text-gray-500">
              {Math.floor(report.duration)} min
              {report.distance > 0 && ` • ${report.distance} km`}
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Your Rewards</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="font-bold text-gray-800">+{report.energy}</p>
                <p className="text-xs text-gray-500">Energy</p>
              </div>
              <div className="text-center">
                <Trophy className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="font-bold text-gray-800">+{report.xp}</p>
                <p className="text-xs text-gray-500">XP</p>
              </div>
              <div className="text-center">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="font-bold text-gray-800">{report.streak}d</p>
                <p className="text-xs text-gray-500">Streak</p>
              </div>
            </div>
            {report.trophy && (
              <div className="mt-3 text-center text-sm font-semibold text-purple-600">
                🏆 {report.trophy}
              </div>
            )}
          </div>

          {(report.community || report.clanEnergy > 0) && (
            <div className="bg-blue-50 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB] mb-3">Your Impact</p>
              <div className="space-y-1.5 text-sm">
                {report.community?.region && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-[#2563EB]" />
                    <span>{report.community.region}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-[#2563EB]">
                      +{report.community.communityContribution || 0} Energy
                    </span>
                  </div>
                )}
                {report.clanEnergy > 0 && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                    <span>Clan contribution</span>
                    <span className="font-semibold text-[#2563EB]">+{report.clanEnergy} Energy</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">AVS Report</p>
              <p className="text-sm font-bold text-[#2563EB]">{report.avs}/100</p>
            </div>
            {report.steps.length > 0 ? (
              <ul className="space-y-2">
                {report.steps.map((s) => (
                  <li key={s.step} className="flex items-center gap-2 text-sm">
                    {s.status === 'GREEN' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                    {s.status === 'ORANGE' && <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />}
                    {s.status === 'RED' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    <span className="text-gray-700 truncate">{s.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Confidence: {report.confidence}</p>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 italic mb-4">"Every move counts."</p>

          <button
            onClick={handleDone}
            className="w-full bg-[#2563EB] text-white py-3 rounded-xl font-semibold hover:bg-[#1D4ED8] transition"
          >
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  // ---- Error state ----
  if (errorState) {
    return (
      <div className="min-h-screen bg-[#F7FAF7] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-center"
        >
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{errorState.title}</h2>
          <p className="text-gray-600 text-sm mb-4">{errorState.message}</p>
          <div className="bg-red-50 rounded-xl p-3 mb-4 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">Reason</p>
            <p className="text-xs text-red-700 break-words">{errorState.detail}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTryAgain}
              className="flex-1 bg-[#2563EB] text-white py-3 rounded-xl font-semibold"
            >
              Try Again
            </button>
            <button
              onClick={handleTryAgain}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
            >
              Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Live session ----
  if (sessionActive) {
    const act = activityTypes.find(a => a.type === selectedType);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F7FAF7]">
        <div className="text-6xl mb-3">{act?.icon}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1 capitalize">
          {act?.label}
        </h2>
        <p className="text-gray-500 mb-8 text-sm">
          {isPaused ? 'Paused' : 'Tracking…'}
        </p>
        <div className="text-7xl font-extrabold text-[#2563EB] mb-8 tabular-nums">
          {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
        </div>
        <div className="flex gap-3">
          <button
            onClick={togglePause}
            className="bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={cancelSession}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleFinish}
            className="bg-[#2563EB] text-white px-8 py-3 rounded-full font-semibold"
          >
            Finish
          </button>
        </div>
      </div>
    );
  }

  // ---- Selection ----
  return (
    <div className="min-h-screen bg-[#F7FAF7] p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Start Activity</h1>
        <p className="text-gray-500 mb-6">Choose an exercise to begin tracking.</p>

        <div className="grid grid-cols-2 gap-4">
          {activityTypes.map(act => (
            <button
              key={act.type}
              onClick={() => startSession(act.type)}
              className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-[#2563EB] hover:shadow-md transition text-center"
            >
              <span className="text-5xl">{act.icon}</span>
              <span className="text-gray-800 font-semibold">{act.label}</span>
              <span className="text-xs text-gray-500 leading-tight">{act.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartActivityPage;