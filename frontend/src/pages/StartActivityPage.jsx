import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Zap, Trophy, Flame, CheckCircle2, AlertTriangle, XCircle,
  MapPin, Users, Footprints, Bike, Dumbbell, PersonStanding,
  Play, Pause, Square, Satellite, WifiOff, ArrowRight, ExternalLink, Sparkles
} from 'lucide-react';
import MoveXCard from '../components/ui/MoveXCard';
import MoveXMoment from '../components/MoveXMoment';
import Button from '../components/ui/Button';

const activityTypes = [
  { type: 'running', label: 'Running', icon: Footprints, description: 'GPS + motion + duration', usesGPS: true },
  { type: 'walking', label: 'Walking', icon: PersonStanding, description: 'GPS + motion + duration', usesGPS: true },
  { type: 'cycling', label: 'Cycling', icon: Bike, description: 'GPS + speed + duration', usesGPS: true },
  { type: 'workout', label: 'Indoor Workout', icon: Dumbbell, description: 'Duration + sensors', usesGPS: false },
];

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const StartActivityPage = ({ user }) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const [progressStage, setProgressStage] = useState('');

  const [gpsStatus, setGpsStatus] = useState('idle');
  const [gpsPoints, setGpsPoints] = useState([]);
  const [distanceMeters, setDistanceMeters] = useState(0);

  const [manualDistanceKm, setManualDistanceKm] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [momentOpen, setMomentOpen] = useState(false);

  const timerRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastPointRef = useRef(null);

  useEffect(() => {
    if (sessionActive && !isPaused) {
      timerRef.current = setInterval(() => setDuration((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive, isPaused]);

  useEffect(() => {
    if (!sessionActive || isPaused || !selectedType) return;
    const act = activityTypes.find((a) => a.type === selectedType);
    if (!act?.usesGPS) { setGpsStatus('unavailable'); return; }
    if (!navigator.geolocation) { setGpsStatus('unavailable'); return; }

    setGpsStatus('acquiring');

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const p = { lat: latitude, lng: longitude, accuracy, t: Date.now() };
        setGpsStatus('active');
        setGpsPoints((prev) => [...prev, p]);
        if (lastPointRef.current && accuracy < 50) {
          const d = haversineMeters(lastPointRef.current, p);
          if (d < 100) setDistanceMeters((prev) => prev + d);
        }
        if (accuracy < 50) lastPointRef.current = p;
      },
      (err) => {
        console.error('GPS error:', err);
        setGpsStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    watchIdRef.current = id;
    return () => {
      navigator.geolocation.clearWatch(id);
      watchIdRef.current = null;
    };
  }, [sessionActive, isPaused, selectedType]);

  useEffect(() => {
    if (report) confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, [report]);

  const startSession = (type) => {
    setSelectedType(type);
    setSessionActive(true);
    setIsPaused(false);
    setDuration(0);
    setReport(null);
    setErrorState(null);
    setProgressStage('');
    setGpsPoints([]);
    setDistanceMeters(0);
    setManualDistanceKm('');
    setShowManualInput(false);
    lastPointRef.current = null;
  };

  const togglePause = () => setIsPaused((p) => !p);

  const cancelSession = () => {
    clearInterval(timerRef.current);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSessionActive(false);
    setSelectedType(null);
    setDuration(0);
    setIsPaused(false);
    setGpsPoints([]);
    setDistanceMeters(0);
    setGpsStatus('idle');
    lastPointRef.current = null;
  };

  const handleFinish = async () => {
    if (processing) return;
    const act = activityTypes.find((a) => a.type === selectedType);
    const durationMin = Number((duration / 60).toFixed(2));
    if (!act?.usesGPS) {
      setShowManualInput(true);
      return;
    }
    if (distanceMeters < 10) {
      setShowManualInput(true);
      return;
    }
    const distance = Number((distanceMeters / 1000).toFixed(2));
    await processActivity(distance, durationMin);
  };

  const handleManualSubmit = async () => {
    const durationMin = Number((duration / 60).toFixed(2));
    const distance = Number(manualDistanceKm) || 0;
    setShowManualInput(false);
    await processActivity(distance, durationMin);
  };

  const processActivity = async (distance, durationMin) => {
    if (processing) return;
    setProcessing(true);
    setProgressStage('Saving activity...');
    clearInterval(timerRef.current);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSessionActive(false);
    setIsPaused(false);

    const avgSpeed = durationMin > 0 ? Number(((distance / durationMin) * 60).toFixed(2)) : 0;
    const gpsPointCount = gpsPoints.length;
    const dataQualityScore = Math.min(
      100,
      Math.round(
        (gpsPointCount > 20 ? 50 : gpsPointCount * 2.5) +
          (gpsPoints.length && gpsPoints.every((p) => p.accuracy < 30) ? 50 : 25)
      )
    );

    const rawData = {
      avgSpeed,
      gpsPoints: gpsPointCount,
      sensorQuality: gpsStatus === 'active' ? 85 : 40,
      dataQualityScore,
      duration: durationMin,
      distanceKm: distance,
      source: gpsStatus === 'active' ? 'gps' : 'manual',
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

      setProgressStage('Running verification...');
      const verifyRes = await API.post(`/verification/run/${activityId}`);
      const data = verifyRes.data;

      setProgressStage('Preparing report...');
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
      });
    } catch (err) {
      const status = err.response?.status;
      const body = err.response?.data;
      const detail = body?.msg || body?.error || err.message || 'Unknown error';
      console.error('Activity processing failed:', { status, body, err });
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
    setGpsPoints([]);
    setDistanceMeters(0);
    setGpsStatus('idle');
    setManualDistanceKm('');
  };

  const handleTryAgain = () => {
    setErrorState(null);
    setSelectedType(null);
    setDuration(0);
    setGpsPoints([]);
    setDistanceMeters(0);
    setGpsStatus('idle');
  };

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-16 h-16 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-base font-semibold text-gray-800">{progressStage || 'Processing...'}</p>
        <p className="text-sm text-gray-500 mt-2">This usually takes a few seconds.</p>
      </div>
    );
  }

  if (report) {
    const decision = (report.decision || '').toUpperCase();
    const isVerified = decision === 'VERIFIED';
    const isProbable = decision === 'PROBABLE';
    const statusIcon = isVerified ? CheckCircle2 : isProbable ? AlertTriangle : XCircle;
    const StatusIcon = statusIcon;
    const statusColor = isVerified
      ? 'text-green-600'
      : isProbable
      ? 'text-amber-600'
      : 'text-red-600';
    const statusBg = isVerified
      ? 'bg-green-50 border-green-200'
      : isProbable
      ? 'bg-amber-50 border-amber-200'
      : 'bg-red-50 border-red-200';

    const city = report.community?.city || null;
    const state = report.community?.state || null;
    const region = report.community?.region || user?.region;

    return (
      <div className="max-w-md mx-auto py-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 22 }}
          className="space-y-4"
        >
          <MoveXCard hero className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">
              MoveX Activity Report
            </p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusBg} mb-4`}>
              <StatusIcon className={`w-5 h-5 ${statusColor}`} />
              <span className={`text-sm font-bold ${statusColor}`}>{decision || 'RECORDED'}</span>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Activity</p>
                <p className="text-gray-900 font-semibold capitalize">{report.activityType}</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Duration</p>
                <p className="text-gray-900 font-semibold">{Math.floor(report.duration)} min</p>
              </div>
              {report.distance > 0 && (
                <>
                  <div className="w-px h-8 bg-gray-200" />
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Distance</p>
                    <p className="text-gray-900 font-semibold">{report.distance} km</p>
                  </div>
                </>
              )}
            </div>
          </MoveXCard>

          <MoveXCard>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
              Your Rewards
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="font-bold text-gray-900">+{report.energy}</p>
                <p className="text-xs text-gray-500">Energy</p>
              </div>
              <div className="text-center">
                <Trophy className="w-5 h-5 text-[#2563EB] mx-auto mb-1" />
                <p className="font-bold text-gray-900">+{report.xp}</p>
                <p className="text-xs text-gray-500">XP</p>
              </div>
              <div className="text-center">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="font-bold text-gray-900">{report.streak}d</p>
                <p className="text-xs text-gray-500">Streak</p>
              </div>
            </div>
            {report.trophy && (
              <div className="mt-3 text-center text-sm font-semibold text-[#2563EB]">
                {report.trophy}
              </div>
            )}
          </MoveXCard>

          {(region || city || state || report.clanEnergy > 0) && (
            <MoveXCard>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                Your Impact
              </p>
              <div className="space-y-2 text-sm">
                {region && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span className="truncate">{[region, city, state].filter(Boolean).join(' · ')}</span>
                    {report.community?.communityContribution > 0 && (
                      <span className="ml-auto font-semibold text-[#2563EB] shrink-0">
                        +{report.community.communityContribution}
                      </span>
                    )}
                  </div>
                )}
                {report.clanEnergy > 0 && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Clan</span>
                    <span className="ml-auto font-semibold text-[#2563EB] shrink-0">
                      +{report.clanEnergy}
                    </span>
                  </div>
                )}
              </div>
            </MoveXCard>
          )}

          <MoveXCard>
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                AVS Report
              </p>
              <p className="text-sm font-bold text-[#2563EB]">{report.avs}/100</p>
            </div>
            {report.steps.length > 0 ? (
              <ul className="space-y-2">
                {report.steps.map((s) => (
                  <li key={s.step} className="flex items-center gap-2 text-sm">
                    {s.status === 'GREEN' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                    {s.status === 'ORANGE' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                    {s.status === 'RED' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    <span className="text-gray-700 truncate">{s.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Confidence: {report.confidence}</p>
            )}
          </MoveXCard>

          <div className="flex flex-col gap-2">
            <Button variant="primary" size="lg" fullWidth onClick={handleDone}>
              Done
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setReport(null);
                  setSelectedType(null);
                  setDuration(0);
                  setGpsPoints([]);
                  setDistanceMeters(0);
                  setGpsStatus('idle');
                  setManualDistanceKm('');
                  navigate('/activity');
                }}
                icon={ExternalLink}
              >
                View Activity
              </Button>
              <Button
                variant="secondary"
                onClick={() => setMomentOpen(true)}
                icon={Sparkles}
              >
                Share Moment
              </Button>
            </div>
          </div>
        </motion.div>

        <MoveXMoment
          isOpen={momentOpen}
          onClose={() => setMomentOpen(false)}
          data={{
            activityType: report.activityType,
            distance: report.distance,
            duration: report.duration,
            energy: report.energy,
            xp: report.xp,
            trophy: report.trophy,
            streak: report.streak,
            region: user?.region,
            city: report.community?.city,
            state: report.community?.state,
            userName: user?.name,
          }}
        />
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="max-w-md mx-auto py-4">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <MoveXCard className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">{errorState.title}</h2>
            <p className="text-sm text-gray-600 mb-4">{errorState.message}</p>
            <div className="bg-red-50 rounded-xl p-3 mb-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1">Reason</p>
              <p className="text-xs text-red-700 break-words">{errorState.detail}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" fullWidth onClick={handleTryAgain}>
                Try Again
              </Button>
            </div>
          </MoveXCard>
        </motion.div>
      </div>
    );
  }

  if (sessionActive) {
    const act = activityTypes.find((a) => a.type === selectedType);
    const ActIcon = act?.icon;
    const distanceKm = (distanceMeters / 1000).toFixed(2);
    const avgSpeed = duration > 0 ? (distanceMeters / 1000 / (duration / 3600)).toFixed(1) : '0.0';

    const gpsStatusEl = (
      <div className="flex items-center gap-1.5 text-xs">
        {gpsStatus === 'active' && (
          <>
            <Satellite className="w-3.5 h-3.5 text-green-500" />
            <span className="text-green-600 font-medium">GPS Active</span>
          </>
        )}
        {gpsStatus === 'acquiring' && (
          <>
            <Satellite className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="text-amber-600 font-medium">Acquiring GPS…</span>
          </>
        )}
        {gpsStatus === 'denied' && (
          <>
            <WifiOff className="w-3.5 h-3.5 text-red-500" />
            <span className="text-red-600 font-medium">GPS denied</span>
          </>
        )}
        {gpsStatus === 'unavailable' && !act?.usesGPS && (
          <span className="text-gray-500 font-medium">Indoor mode</span>
        )}
      </div>
    );

    return (
      <div className="max-w-md mx-auto py-4 space-y-4">
        <MoveXCard hero elevated className="text-center">
          {ActIcon && (
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#2563EB]/10 flex items-center justify-center mb-3">
              <ActIcon className="w-8 h-8 text-[#2563EB]" />
            </div>
          )}
          <h2 className="text-lg font-bold text-gray-900 capitalize">{act?.label}</h2>
          <div className="flex justify-center mt-1.5">{gpsStatusEl}</div>
          <div className="text-6xl font-extrabold text-[#2563EB] tabular-nums mt-5 mb-1">
            {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            {isPaused ? 'Paused' : 'Elapsed'}
          </p>
        </MoveXCard>

        {act?.usesGPS && (
          <div className="grid grid-cols-2 gap-3">
            <MoveXCard padded={false} className="p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Distance</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">
                {distanceKm}<span className="text-sm text-gray-500 ml-0.5">km</span>
              </p>
            </MoveXCard>
            <MoveXCard padded={false} className="p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Avg Speed</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">
                {avgSpeed}<span className="text-sm text-gray-500 ml-0.5">km/h</span>
              </p>
            </MoveXCard>
          </div>
        )}

        {showManualInput && (
          <MoveXCard>
            <p className="text-sm font-semibold text-gray-800 mb-1">Distance not tracked</p>
            <p className="text-xs text-gray-500 mb-3">
              {act?.usesGPS ? 'GPS unavailable. Enter distance manually.' : 'Enter your workout distance.'}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Distance (km)"
                value={manualDistanceKm}
                onChange={(e) => setManualDistanceKm(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
              />
              <Button variant="primary" onClick={handleManualSubmit} disabled={!manualDistanceKm}>
                Save
              </Button>
            </div>
          </MoveXCard>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="secondary"
            onClick={togglePause}
            icon={isPaused ? Play : Pause}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="ghost" onClick={cancelSession} icon={Square}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleFinish} loading={processing}>
            Finish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Start Activity</h1>
        <p className="text-sm text-gray-500 mt-1">Choose an exercise to begin tracking.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activityTypes.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.type}
              onClick={() => startSession(act.type)}
              className="text-left bg-white border border-gray-200 rounded-2xl p-5 hover:border-[#2563EB] hover:shadow-elevated transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-[#2563EB]" />
              </div>
              <p className="text-base font-semibold text-gray-900">{act.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{act.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StartActivityPage;