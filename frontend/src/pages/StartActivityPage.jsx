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
import MoveXGlassPanel from '../components/ui/MoveXGlassPanel';
import Button from '../components/ui/Button';
import MoveXMoment from '../components/MoveXMoment';

const activityTypes = [
  { type: 'running', label: 'Running', icon: Footprints, description: 'GPS + motion + duration', usesGPS: true, accent: 'text-white', bg: 'icon-tile-blue' },
  { type: 'walking', label: 'Walking', icon: PersonStanding, description: 'GPS + motion + duration', usesGPS: true, accent: 'text-white', bg: 'icon-tile-mint' },
  { type: 'cycling', label: 'Cycling', icon: Bike, description: 'GPS + speed + duration', usesGPS: true, accent: 'text-white', bg: 'icon-tile-ember' },
  { type: 'workout', label: 'Indoor Workout', icon: Dumbbell, description: 'Duration + sensors', usesGPS: false, accent: 'text-white', bg: 'icon-tile-gold' },
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
  const [momentOpen, setMomentOpen] = useState(false);

  const [gpsStatus, setGpsStatus] = useState('idle');
  const [gpsPoints, setGpsPoints] = useState([]);
  const [distanceMeters, setDistanceMeters] = useState(0);

  const [manualDistanceKm, setManualDistanceKm] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

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
    if (!act?.usesGPS) { setShowManualInput(true); return; }
    if (distanceMeters < 10) { setShowManualInput(true); return; }
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

  const handleViewActivity = () => {
    handleDone();
    navigate('/activity');
  };

  const handleTryAgain = () => {
    setErrorState(null);
    setSelectedType(null);
    setDuration(0);
    setGpsPoints([]);
    setDistanceMeters(0);
    setGpsStatus('idle');
  };

  // ============================================================
  // PROCESSING
  // ============================================================
  if (processing) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <MoveXGlassPanel className="max-w-sm w-full text-center py-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-[#2563EB]/20 border-t-[#2563EB] animate-spin" />
          <p className="text-base font-semibold text-ink-900">{progressStage || 'Processing...'}</p>
          <p className="text-sm text-ink-500 mt-2">This usually takes a few seconds.</p>
        </MoveXGlassPanel>
      </div>
    );
  }

  // ============================================================
  // REPORT — Liquid Glass on colored backdrop
  // ============================================================
  if (report) {
    const decision = (report.decision || '').toUpperCase();
    const isVerified = decision === 'VERIFIED';
    const isProbable = decision === 'PROBABLE';
    const StatusIcon = isVerified ? CheckCircle2 : isProbable ? AlertTriangle : XCircle;
    const statusColor = isVerified ? 'text-mint-600' : isProbable ? 'text-gold-600' : 'text-red-600';
    const statusBg = isVerified ? 'bg-gradient-to-r from-mint-500/20 to-mint-400/10 border-mint-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : isProbable ? 'bg-gradient-to-r from-gold-500/20 to-gold-400/10 border-gold-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'bg-gradient-to-r from-red-500/20 to-red-400/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]';

    const city = report.community?.city || null;
    const state = report.community?.state || null;
    const region = report.community?.region || user?.region;

    return (
      <div className="min-h-[80vh] -mx-3 sm:-mx-4 -mt-2 px-3 sm:px-4 pt-6 pb-8 bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#E0E7FF] relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#2563EB]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#2563EB]/8 blur-3xl pointer-events-none" />

        <div className="relative max-w-md mx-auto drop-shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <MoveXGlassPanel className="text-center">
              {/* Header */}
              <p className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-3">
                MoveX Activity Report
              </p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusBg} mb-4`}>
                <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                <span className={`text-sm font-bold ${statusColor}`}>{decision || 'RECORDED'}</span>
              </div>

              {/* Primary numbers */}
              <div className="flex items-stretch justify-center gap-3 sm:gap-6 text-left mb-2">
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Activity</p>
                  <p className="text-base font-bold text-ink-900 capitalize mt-0.5">{report.activityType}</p>
                </div>
                <div className="w-px bg-ink-900/10" />
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Duration</p>
                  <p className="text-base font-bold text-ink-900 mt-0.5 tabular-nums">{Math.floor(report.duration)} min</p>
                </div>
                {report.distance > 0 && (
                  <>
                    <div className="w-px bg-ink-900/10" />
                    <div className="flex-1 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Distance</p>
                      <p className="text-base font-bold text-ink-900 mt-0.5 tabular-nums">{report.distance} km</p>
                    </div>
                  </>
                )}
              </div>
            </MoveXGlassPanel>

            {/* Rewards */}
            <MoveXGlassPanel className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3 text-center">
                Your Rewards
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="w-9 h-9 mx-auto rounded-xl bg-gold-500/15 flex items-center justify-center mb-1.5">
                    <Zap className="w-4 h-4 text-gold-600" />
                  </div>
                  <p className="font-bold text-ink-900 tabular-nums">+{report.energy}</p>
                  <p className="text-[10px] text-ink-500 uppercase tracking-wider">Energy</p>
                </div>
                <div className="text-center">
                  <div className="w-9 h-9 mx-auto rounded-xl bg-[#2563EB]/15 flex items-center justify-center mb-1.5">
                    <Trophy className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <p className="font-bold text-ink-900 tabular-nums">+{report.xp}</p>
                  <p className="text-[10px] text-ink-500 uppercase tracking-wider">XP</p>
                </div>
                <div className="text-center">
                  <div className="w-9 h-9 mx-auto rounded-xl bg-ember-500/15 flex items-center justify-center mb-1.5">
                    <Flame className="w-4 h-4 text-ember-500" />
                  </div>
                  <p className="font-bold text-ink-900 tabular-nums">{report.streak}d</p>
                  <p className="text-[10px] text-ink-500 uppercase tracking-wider">Streak</p>
                </div>
              </div>
              {report.trophy && (
                <div className="mt-3 pt-3 border-t border-ink-900/10 text-center text-sm font-semibold text-[#2563EB]">
                  {report.trophy}
                </div>
              )}
            </MoveXGlassPanel>

            {/* Impact */}
            {(region || city || state || report.clanEnergy > 0) && (
              <MoveXGlassPanel className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3 text-center">
                  Your Impact
                </p>
                <div className="space-y-2 text-sm">
                  {region && (
                    <div className="flex items-center gap-2 text-ink-700">
                      <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <span className="truncate">{[region, city, state].filter(Boolean).join(' · ')}</span>
                      {report.community?.communityContribution > 0 && (
                        <span className="ml-auto font-semibold text-[#2563EB] shrink-0 tabular-nums">
                          +{report.community.communityContribution}
                        </span>
                      )}
                    </div>
                  )}
                  {report.clanEnergy > 0 && (
                    <div className="flex items-center gap-2 text-ink-700">
                      <Users className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <span>Clan</span>
                      <span className="ml-auto font-semibold text-[#2563EB] shrink-0 tabular-nums">
                        +{report.clanEnergy}
                      </span>
                    </div>
                  )}
                </div>
              </MoveXGlassPanel>
            )}

            {/* AVS */}
            <MoveXGlassPanel className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  AVS Report
                </p>
                <p className="text-sm font-bold text-[#2563EB] tabular-nums">{report.avs}/100</p>
              </div>
              {report.steps.length > 0 ? (
                <ul className="space-y-2">
                  {report.steps.map((s) => (
                    <li key={s.step} className="flex items-center gap-2 text-sm">
                      {s.status === 'GREEN' && <CheckCircle2 className="w-4 h-4 text-mint-500 shrink-0" />}
                      {s.status === 'ORANGE' && <AlertTriangle className="w-4 h-4 text-gold-500 shrink-0" />}
                      {s.status === 'RED' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      <span className="text-ink-700 truncate">{s.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-500">Confidence: {report.confidence}</p>
              )}
            </MoveXGlassPanel>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <Button variant="primary" size="lg" fullWidth onClick={handleDone}>
                Done
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={handleViewActivity} icon={ExternalLink}>
                  View Activity
                </Button>
                <Button variant="premium" onClick={() => setMomentOpen(true)} icon={Sparkles}>
                  Share Moment
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

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

  // ============================================================
  // ERROR
  // ============================================================
  if (errorState) {
    return (
      <div className="max-w-md mx-auto py-4">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <MoveXCard className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-3">
              <XCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-ink-900 mb-1">{errorState.title}</h2>
            <p className="text-sm text-ink-500 mb-4">{errorState.message}</p>
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 mb-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1">Reason</p>
              <p className="text-xs text-red-700 break-words">{errorState.detail}</p>
            </div>
            <Button variant="primary" fullWidth onClick={handleTryAgain}>
              Try Again
            </Button>
          </MoveXCard>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // LIVE SESSION — Glass HUD
  // ============================================================
  if (sessionActive) {
    const act = activityTypes.find((a) => a.type === selectedType);
    const ActIcon = act?.icon;
    const distanceKm = (distanceMeters / 1000).toFixed(2);
    const avgSpeed = duration > 0 ? (distanceMeters / 1000 / (duration / 3600)).toFixed(1) : '0.0';

    const gpsStatusEl = (
      <div className="inline-flex items-center gap-1.5 text-xs">
        {gpsStatus === 'active' && (
          <>
            <Satellite className="w-3.5 h-3.5 text-mint-500" />
            <span className="text-mint-600 font-medium">GPS Active</span>
          </>
        )}
        {gpsStatus === 'acquiring' && (
          <>
            <Satellite className="w-3.5 h-3.5 text-gold-500 animate-pulse" />
            <span className="text-gold-600 font-medium">Acquiring GPS…</span>
          </>
        )}
        {gpsStatus === 'denied' && (
          <>
            <WifiOff className="w-3.5 h-3.5 text-red-500" />
            <span className="text-red-600 font-medium">GPS denied</span>
          </>
        )}
        {gpsStatus === 'unavailable' && !act?.usesGPS && (
          <span className="text-ink-500 font-medium">Indoor mode</span>
        )}
      </div>
    );

    return (
      <div className="min-h-[80vh] -mx-3 sm:-mx-4 -mt-2 px-3 sm:px-4 pt-6 pb-8 bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#E0E7FF] relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#2563EB]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-md mx-auto space-y-4">
          {/* Big timer HUD */}
          <MoveXGlassPanel className="text-center py-8">
            <div className={`w-16 h-16 mx-auto rounded-2xl ${act?.bg || 'icon-tile-soft-blue'} flex items-center justify-center mb-3 shadow-lg`}>
              {ActIcon && <ActIcon className={`w-8 h-8 ${act?.accent || 'text-[#2563EB]'}`} />}
            </div>
            <h2 className="text-lg font-bold text-ink-900 capitalize">{act?.label}</h2>
            <div className="flex justify-center mt-2">{gpsStatusEl}</div>
            <div className="text-6xl sm:text-7xl font-extrabold text-[#2563EB] tabular-nums mt-6 mb-1 tracking-tight">
              {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
            </div>
            <p className="text-[10px] text-ink-500 uppercase tracking-widest font-semibold">
              {isPaused ? 'Paused' : 'Elapsed'}
            </p>
          </MoveXGlassPanel>

          {/* Live stats */}
          {act?.usesGPS && (
            <div className="grid grid-cols-2 gap-3">
              <MoveXGlassPanel className="text-center py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Distance</p>
                <p className="text-2xl font-bold text-ink-900 tabular-nums mt-1">
                  {distanceKm}<span className="text-sm text-ink-500 ml-0.5">km</span>
                </p>
              </MoveXGlassPanel>
              <MoveXGlassPanel className="text-center py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Avg Speed</p>
                <p className="text-2xl font-bold text-ink-900 tabular-nums mt-1">
                  {avgSpeed}<span className="text-sm text-ink-500 ml-0.5">km/h</span>
                </p>
              </MoveXGlassPanel>
            </div>
          )}

          {/* Manual distance fallback */}
          {showManualInput && (
            <MoveXCard>
              <p className="text-sm font-semibold text-ink-900 mb-1">Distance not tracked</p>
              <p className="text-xs text-ink-500 mb-3">
                {act?.usesGPS ? 'GPS unavailable. Enter distance manually.' : 'Enter your workout distance.'}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Distance (km)"
                  value={manualDistanceKm}
                  onChange={(e) => setManualDistanceKm(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
                />
                <Button variant="primary" onClick={handleManualSubmit} disabled={!manualDistanceKm}>
                  Save
                </Button>
              </div>
            </MoveXCard>
          )}

          {/* Controls */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" onClick={togglePause} icon={isPaused ? Play : Pause}>
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
      </div>
    );
  }

  // ============================================================
  // SELECTION — Spatial hero + Bento grid
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Spatial hero */}
      <div className="relative hero-premium text-white rounded-hero p-5 sm:p-6 md:p-7 shadow-hero">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
            Start Activity
          </h1>
          <p className="text-sm md:text-base text-white/85 max-w-lg">
            Choose an activity to begin tracking. GPS works best outdoors.
          </p>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-2 gap-3">
        {activityTypes.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.type}
              onClick={() => startSession(act.type)}
              className="text-left bg-white rounded-card p-4 sm:p-5 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] group"
            >
              <div className={`w-12 h-12 rounded-2xl ${act.bg} flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                <Icon className={`w-6 h-6 ${act.accent}`} />
              </div>
              <p className="text-sm sm:text-base font-semibold text-ink-900">{act.label}</p>
              <p className="text-[11px] sm:text-xs text-ink-500 mt-0.5">{act.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StartActivityPage;