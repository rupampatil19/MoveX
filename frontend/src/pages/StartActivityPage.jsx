import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Zap, Trophy, Flame, CheckCircle2, AlertTriangle, XCircle,
  MapPin, Users, Footprints, Bike, Dumbbell, PersonStanding,
  Play, Pause, Square, Satellite, WifiOff, ArrowRight, ExternalLink, Sparkles,
  Compass, Smartphone, Activity as ActivityIcon, ShieldCheck, X, Loader2,
  TrendingUp,
} from 'lucide-react';
import MoveXCard from '../components/ui/MoveXCard';
import MoveXGlassPanel from '../components/ui/MoveXGlassPanel';
import Button from '../components/ui/Button';
import MoveXMoment from '../components/MoveXMoment';
import { MoveXSensorService } from '../services/sensorService';
import { getAthloniaBandService } from '../services/athloniaBandService';

const activityTypes = [
  { type: 'running', label: 'Running',        icon: Footprints,     description: 'GPS + motion + duration', usesGPS: true,  accent: 'text-white', bg: 'icon-tile-blue'  },
  { type: 'walking', label: 'Walking',        icon: PersonStanding, description: 'GPS + motion + duration', usesGPS: true,  accent: 'text-white', bg: 'icon-tile-mint'  },
  { type: 'cycling', label: 'Cycling',        icon: Bike,           description: 'GPS + speed + duration',  usesGPS: true,  accent: 'text-white', bg: 'icon-tile-ember' },
  { type: 'workout', label: 'Indoor Workout', icon: Dumbbell,       description: 'Duration + sensors',      usesGPS: false, accent: 'text-white', bg: 'icon-tile-gold'  },
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

function computeDistanceFromPoints(points) {
  if (!points || points.length < 2) return 0;
  let total = 0;
  let last = null;
  for (const p of points) {
    if (last && p.acc < 50) {
      const d = haversineMeters(last, p);
      if (d < 100) total += d;
    }
    if (p.acc < 50) last = p;
  }
  return total;
}

const StartActivityPage = ({ user }) => {
  const navigate = useNavigate();

  // Session state
  const [selectedType, setSelectedType] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const [progressStage, setProgressStage] = useState('');
  const [momentOpen, setMomentOpen] = useState(false);

  // Permission flow state
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [pendingType, setPendingType] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  // Live sensor state
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [sensorSnapshot, setSensorSnapshot] = useState(null);
  const [liveSensors, setLiveSensors] = useState({
    gps: 'idle', accel: 'idle', gyro: 'idle', mag: 'idle',
  });

  // Band capture state
  const [bandActive, setBandActive] = useState(false);

  // Manual distance fallback
  const [manualDistanceKm, setManualDistanceKm] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const timerRef = useRef(null);
  const sensorRef = useRef(null);
  const bandCaptureRef = useRef(null);

  // ==========================================================
  // ATHLONIA AI BAND - capture during session
  // ==========================================================
  const startBandCapture = () => {
    try {
      const svc = getAthloniaBandService();
      if (!svc || !svc.connected || typeof svc.subscribe !== 'function') return false;

      const emptyBucket = () => ({ ts: null, hrSum: 0, hrCount: 0, cadenceSum: 0, cadenceCount: 0, qualitySum: 0, qualityCount: 0, stepsLast: 0 });
      const capture = {
        startTs: Date.now(),
        deviceName: svc.device?.name || 'Athlonia_Band',
        deviceId: svc.device?.id || null,
        samples: [],
        packetCount: 0,
        hrSum: 0, hrCount: 0, hrValidCount: 0,
        maxHR: 0, minHR: Infinity,
        cadenceSum: 0, cadenceCount: 0, maxCadence: 0,
        qualitySum: 0,
        batteryStart: null, batteryEnd: null,
        stepsAtStart: null, stepsAtEnd: null,
        bucket: emptyBucket(),
      };

      const flushBucket = () => {
        const b = capture.bucket;
        if (b.qualityCount === 0) return;
        capture.samples.push({
          t: Math.round((b.ts - capture.startTs) / 1000),
          hr: b.hrCount > 0 ? Math.round(b.hrSum / b.hrCount) : 0,
          cadence: b.cadenceCount > 0 ? Math.round(b.cadenceSum / b.cadenceCount) : 0,
          steps: b.stepsLast,
          quality: Math.round(b.qualitySum / b.qualityCount),
        });
        capture.bucket = emptyBucket();
      };

      const unsub = svc.subscribe((p) => {
        capture.packetCount++;
        if (capture.stepsAtStart === null) capture.stepsAtStart = p.steps;
        capture.stepsAtEnd = p.steps;
        if (capture.batteryStart === null) capture.batteryStart = p.battery;
        capture.batteryEnd = p.battery;

        if (p.hr_valid && p.heart_rate > 0) {
          capture.hrSum += p.heart_rate; capture.hrCount++; capture.hrValidCount++;
          if (p.heart_rate > capture.maxHR) capture.maxHR = p.heart_rate;
          if (p.heart_rate < capture.minHR) capture.minHR = p.heart_rate;
        }
        if (p.cadence > 0) {
          capture.cadenceSum += p.cadence; capture.cadenceCount++;
          if (p.cadence > capture.maxCadence) capture.maxCadence = p.cadence;
        }
        capture.qualitySum += p.quality;

        const now = Date.now();
        const sec = Math.floor(now / 1000);
        if (capture.bucket.ts !== null && Math.floor(capture.bucket.ts / 1000) !== sec) {
          flushBucket();
        }
        const b = capture.bucket;
        if (b.ts === null) b.ts = now;
        if (p.hr_valid && p.heart_rate > 0) { b.hrSum += p.heart_rate; b.hrCount++; }
        if (p.cadence > 0) { b.cadenceSum += p.cadence; b.cadenceCount++; }
        b.qualitySum += p.quality; b.qualityCount++;
        b.stepsLast = p.steps;
      });

      bandCaptureRef.current = { capture, unsub, flushBucket };
      return true;
    } catch (err) {
      console.warn('Band capture start failed:', err);
      return false;
    }
  };

  const stopBandCapture = () => {
    const ref = bandCaptureRef.current;
    if (!ref) return null;
    try { ref.flushBucket(); } catch {}
    try { ref.unsub(); } catch {}
    bandCaptureRef.current = null;
    return ref.capture;
  };

  const buildBandPayload = (capture) => {
    if (!capture || capture.packetCount === 0) return null;
    const c = capture;
    const durationSec = Math.round((Date.now() - c.startTs) / 1000);
    const totalSteps = (c.stepsAtStart !== null && c.stepsAtEnd !== null && c.stepsAtEnd >= c.stepsAtStart)
      ? c.stepsAtEnd - c.stepsAtStart : null;
    return {
      connected: true,
      deviceName: c.deviceName,
      deviceId: c.deviceId,
      durationSec,
      packetCount: c.packetCount,
      sampleCount: c.samples.length,
      stats: {
        avgHR: c.hrCount > 0 ? Math.round(c.hrSum / c.hrCount) : 0,
        maxHR: c.hrCount > 0 ? c.maxHR : 0,
        minHR: c.hrCount > 0 ? c.minHR : 0,
        avgCadence: c.cadenceCount > 0 ? Math.round(c.cadenceSum / c.cadenceCount) : 0,
        maxCadence: c.maxCadence,
        avgQuality: c.packetCount > 0 ? Math.round(c.qualitySum / c.packetCount) : 0,
        hrValidRatio: c.packetCount > 0 ? Number((c.hrValidCount / c.packetCount).toFixed(3)) : 0,
        batteryStart: c.batteryStart,
        batteryEnd: c.batteryEnd,
        stepsAtStart: c.stepsAtStart,
        stepsAtEnd: c.stepsAtEnd,
        totalSteps,
      },
      samples: c.samples,
    };
  };

  // ----------------------------------------------------------
  // TIMER
  // ----------------------------------------------------------
  useEffect(() => {
    if (sessionActive && !isPaused) {
      timerRef.current = setInterval(() => setDuration((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive, isPaused]);

  // ----------------------------------------------------------
  // LIVE DISTANCE POLL (from sensor service)
  // ----------------------------------------------------------
  useEffect(() => {
    if (!sessionActive) return;
    const id = setInterval(() => {
      if (sensorRef.current) {
        const snap = sensorRef.current.getSnapshot();
        setDistanceMeters(computeDistanceFromPoints(snap.gps.points));
        setLiveSensors({
          gps:   snap.gps.error ? snap.gps.error : (snap.gps.count > 0 ? 'active' : 'acquiring'),
          accel: snap.motion.count > 0 ? 'active' : 'idle',
          gyro:  snap.motion.count > 0 ? 'active' : 'idle',
          mag:   snap.motion.count > 0 ? 'active' : 'idle',
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [sessionActive]);

  // ----------------------------------------------------------
  // CONFETTI ON REPORT
  // ----------------------------------------------------------
  useEffect(() => {
    if (report) confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, [report]);

  // ----------------------------------------------------------
  // OPEN PERMISSION MODAL
  // ----------------------------------------------------------
  const openPermissions = (type) => {
    setPendingType(type);
    setPermissionModalOpen(true);
    setPermissions(null);
  };

  const requestPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const svc = new MoveXSensorService();
      const status = await svc.requestPermissions();
      setPermissions(status);
      if (!sensorRef.current) sensorRef.current = svc;
    } catch (err) {
      console.error('Permission request failed:', err);
      setPermissions({
        geolocation: 'unavailable',
        accelerometer: 'unavailable',
        gyroscope: 'unavailable',
        magnetometer: 'unavailable',
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  // ----------------------------------------------------------
  // START SESSION
  // ----------------------------------------------------------
  const beginSession = async () => {
    const type = pendingType;
    setPermissionModalOpen(false);

    if (!sensorRef.current) sensorRef.current = new MoveXSensorService();

    // If permissions were granted (or user requested them), start service
    if (permissions && permissions.geolocation !== 'unavailable') {
      try {
        await sensorRef.current.start();
      } catch (err) {
        console.error('Sensor start failed:', err);
      }
    }

    // Start Athlonia band capture if connected (singleton survives route changes)
    setBandActive(startBandCapture());

    setSelectedType(type);
    setSessionActive(true);
    setIsPaused(false);
    setDuration(0);
    setReport(null);
    setErrorState(null);
    setProgressStage('');
    setDistanceMeters(0);
    setManualDistanceKm('');
    setShowManualInput(false);
    setSensorSnapshot(null);
    setLiveSensors({ gps: 'acquiring', accel: 'idle', gyro: 'idle', mag: 'idle' });
  };

  const startWithoutSensors = () => {
    setPermissions({
      geolocation: 'skipped',
      accelerometer: 'skipped',
      gyroscope: 'skipped',
      magnetometer: 'skipped',
    });
    beginSession();
  };

  // ----------------------------------------------------------
  // CONTROLS
  // ----------------------------------------------------------
  const togglePause = () => setIsPaused((p) => !p);

  const cancelSession = () => {
    clearInterval(timerRef.current);
    try { sensorRef.current?.stop(); } catch {}
    stopBandCapture();
    setBandActive(false);
    setSessionActive(false);
    setSelectedType(null);
    setDuration(0);
    setIsPaused(false);
    setDistanceMeters(0);
    setManualDistanceKm('');
    setLiveSensors({ gps: 'idle', accel: 'idle', gyro: 'idle', mag: 'idle' });
  };

  // ----------------------------------------------------------
  // FINISH
  // ----------------------------------------------------------
  const handleFinish = async () => {
    if (processing) return;
    const act = activityTypes.find((a) => a.type === selectedType);
    const durationMin = Number((duration / 60).toFixed(2));

    // Get snapshot from sensor service
    let snap = null;
    try { snap = sensorRef.current?.getSnapshot(); } catch {}

    const gpsDistance = snap ? computeDistanceFromPoints(snap.gps.points) : distanceMeters;
    const hasGps = snap && snap.gps.count > 0;

    if (!act?.usesGPS && !snap) {
      setShowManualInput(true);
      return;
    }
    if (act?.usesGPS && (!hasGps || gpsDistance < 10)) {
      setShowManualInput(true);
      return;
    }

    const distance = Number((gpsDistance / 1000).toFixed(2));
    await processActivity(distance, durationMin, snap);
  };

  const handleManualSubmit = async () => {
    const durationMin = Number((duration / 60).toFixed(2));
    const distance = Number(manualDistanceKm) || 0;
    setShowManualInput(false);

    let snap = null;
    try { snap = sensorRef.current?.getSnapshot(); } catch {}
    await processActivity(distance, durationMin, snap);
  };

  const processActivity = async (distance, durationMin, snapshot) => {
    if (processing) return;
    setProcessing(true);
    setProgressStage('Saving activity...');

    clearInterval(timerRef.current);
    try { sensorRef.current?.stop(); } catch {}

    const bandCaptureData = stopBandCapture();
    const bandPayload = buildBandPayload(bandCaptureData);
    setBandActive(false);

    setSessionActive(false);
    setIsPaused(false);

    // Pull final snapshot after stop (in case new data arrived)
    let finalSnap = snapshot;
    try { finalSnap = sensorRef.current?.getSnapshot() || snapshot; } catch {}
    setSensorSnapshot(finalSnap);

    const gpsCount = finalSnap?.gps?.count || 0;
    const motionCount = finalSnap?.motion?.count || 0;

    const rawData = {
      source: motionCount > 0 ? 'phone+sensors' : 'phone',
      phone: {
        gpsPoints: finalSnap?.gps?.points || [],
        motionSamples: finalSnap?.motion?.samples || [],
        gpsStats: {
          count: gpsCount,
          avgAccuracy: finalSnap?.gps?.avgAccuracy || null,
          error: finalSnap?.gps?.error || null,
        },
        motionStats: {
          count: motionCount,
          avgIntensity: finalSnap?.motion?.avgIntensity || 0,
        },
        permissions: finalSnap?.permissions || {},
      },
      avgSpeed: durationMin > 0 ? Number(((distance / durationMin) * 60).toFixed(2)) : 0,
      duration: durationMin,
      distanceKm: distance,
    };

    if (bandPayload) {
      rawData.band = bandPayload;
      if (rawData.source === 'phone') rawData.source = 'phone+band';
      else if (rawData.source === 'phone+sensors') rawData.source = 'phone+sensors+band';
    }

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
        sensorEvidence: {
          gpsCount,
          motionCount,
          avgAccuracy: finalSnap?.gps?.avgAccuracy,
          avgIntensity: finalSnap?.motion?.avgIntensity,
          permissions: finalSnap?.permissions || {},
        },
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

  // ----------------------------------------------------------
  // POST-REPORT HANDLERS
  // ----------------------------------------------------------
  const handleDone = () => {
    stopBandCapture();
    setBandActive(false);
    setReport(null);
    setSelectedType(null);
    setDuration(0);
    setDistanceMeters(0);
    setManualDistanceKm('');
    setSensorSnapshot(null);
    setLiveSensors({ gps: 'idle', accel: 'idle', gyro: 'idle', mag: 'idle' });
  };

  const handleViewActivity = () => {
    handleDone();
    navigate('/activity');
  };

  const handleTryAgain = () => {
    setErrorState(null);
    setSelectedType(null);
    setDuration(0);
    setDistanceMeters(0);
  };

  // ============================================================
  // PERMISSION MODAL
  // ============================================================
  if (permissionModalOpen) {
    const SensorRow = ({ icon: Icon, name, status, description }) => {
      const color =
        status === 'granted' ? 'text-mint-600 bg-mint-500/10' :
        status === 'denied' ? 'text-red-600 bg-red-500/10' :
        status === 'unavailable' ? 'text-ink-400 bg-surface-100' :
        'text-ink-500 bg-surface-100';
      const StatusIcon =
        status === 'granted' ? CheckCircle2 :
        status === 'denied' ? XCircle :
        status === 'unavailable' ? AlertTriangle :
        Loader2;
      const label =
        status === 'granted' ? 'Granted' :
        status === 'denied' ? 'Denied' :
        status === 'unavailable' ? 'Not available' :
        status === 'pending' ? 'Checking...' :
        'Not checked yet';

      return (
        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-white/50">
          <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink-900">{name}</p>
            <p className="text-[11px] text-ink-500 truncate">{description}</p>
          </div>
          <div className={`flex items-center gap-1 text-[11px] font-semibold ${color.split(' ')[0]} shrink-0`}>
            <StatusIcon className={`w-3.5 h-3.5 ${status === 'pending' ? 'animate-spin' : ''}`} />
            <span>{label}</span>
          </div>
        </div>
      );
    };

    const allChecked = !!permissions;
    const gpsGranted = permissions?.geolocation === 'granted';

    return (
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
        onClick={() => setPermissionModalOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <MoveXGlassPanel className="max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl icon-tile-blue flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink-900">Verify Your Activity</h2>
                  <p className="text-[11px] text-ink-500">MoveX uses sensors to verify real movement</p>
                </div>
              </div>
              <button
                onClick={() => setPermissionModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/60 text-ink-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 mb-4">
              <SensorRow
                icon={MapPin}
                name="GPS Location"
                description="Tracks your outdoor path and distance"
                status={permissions?.geolocation || (permissionsLoading ? 'pending' : 'idle')}
              />
              <SensorRow
                icon={Smartphone}
                name="Motion Sensors"
                description="Detects acceleration and body movement"
                status={permissions?.accelerometer || (permissionsLoading ? 'pending' : 'idle')}
              />
              <SensorRow
                icon={ActivityIcon}
                name="Gyroscope"
                description="Validates rotation and gait pattern"
                status={permissions?.gyroscope || (permissionsLoading ? 'pending' : 'idle')}
              />
              <SensorRow
                icon={Compass}
                name="Compass"
                description="Verifies heading and direction changes"
                status={permissions?.magnetometer || (permissionsLoading ? 'pending' : 'idle')}
              />
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mb-4">
              <p className="text-[11px] text-ink-700 leading-relaxed">
                <strong className="text-[#2563EB]">Why this matters:</strong> Genuine movement across multiple sensors is hard to fake. This keeps the leaderboard fair for everyone.
              </p>
            </div>

            {!allChecked ? (
              <Button
                variant="premium"
                fullWidth
                icon={permissionsLoading ? Loader2 : ShieldCheck}
                loading={permissionsLoading}
                onClick={requestPermissions}
              >
                {permissionsLoading ? 'Checking sensors...' : 'Check Sensor Access'}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="premium" fullWidth onClick={beginSession} icon={ArrowRight}>
                  {gpsGranted ? 'Allow & Start' : 'Start Anyway'}
                </Button>
                <button
                  onClick={startWithoutSensors}
                  className="w-full text-xs text-ink-500 hover:text-ink-700 py-2 transition-colors"
                >
                  Use without sensors
                </button>
              </div>
            )}
          </MoveXGlassPanel>
        </motion.div>
      </div>
    );
  }

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
  // REPORT
  // ============================================================
  if (report) {
    const decision = (report.decision || '').toUpperCase();
    const isVerified = decision === 'VERIFIED';
    const isProbable = decision === 'PROBABLE';
    const StatusIcon = isVerified ? CheckCircle2 : isProbable ? AlertTriangle : XCircle;
    const statusColor = isVerified ? 'text-mint-600' : isProbable ? 'text-gold-600' : 'text-red-600';
    const statusBg = isVerified ? 'bg-mint-500/10 border-mint-500/30' : isProbable ? 'bg-gold-500/10 border-gold-500/30' : 'bg-red-500/10 border-red-500/30';

    const city = report.community?.city || null;
    const state = report.community?.state || null;
    const region = report.community?.region || user?.region;
    const ev = report.sensorEvidence || {};

    const permLabel = (v) => v === 'granted' ? 'Granted' : v === 'denied' ? 'Denied' : v === 'unavailable' ? 'N/A' : v === 'skipped' ? 'Skipped' : '—';
    const permColor = (v) => v === 'granted' ? 'text-mint-600' : v === 'denied' ? 'text-red-600' : 'text-ink-400';

    return (
      <div className="min-h-[80vh] -mx-3 sm:-mx-4 -mt-2 px-3 sm:px-4 pt-6 pb-8 bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#E0E7FF] relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#2563EB]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#2563EB]/8 blur-3xl pointer-events-none" />

        <div className="relative max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            {/* STATUS */}
            <MoveXGlassPanel className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-3">
                MoveX Activity Report
              </p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusBg} mb-4`}>
                <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                <span className={`text-sm font-bold ${statusColor}`}>{decision || 'RECORDED'}</span>
              </div>

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

            {/* REWARDS */}
            <MoveXGlassPanel className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3 text-center">
                Your Rewards
              </p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="w-9 h-9 mx-auto rounded-xl bg-gold-500/15 flex items-center justify-center mb-1.5">
                    <Zap className="w-4 h-4 text-gold-600" />
                  </div>
                  <p className="font-bold text-ink-900 tabular-nums text-sm">+{report.energy}</p>
                  <p className="text-[9px] text-ink-500 uppercase tracking-wider">Energy</p>
                </div>
                <div className="text-center">
                  <div className="w-9 h-9 mx-auto rounded-xl bg-[#2563EB]/15 flex items-center justify-center mb-1.5">
                    <TrendingUp className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <p className="font-bold text-ink-900 tabular-nums text-sm">+{report.xp}</p>
                  <p className="text-[9px] text-ink-500 uppercase tracking-wider">XP</p>
                </div>
                <div className="text-center">
                  <div className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center mb-1.5 ${
                    report.trophy ? 'bg-purple-500/15' : 'bg-surface-100'
                  }`}>
                    <Trophy className={`w-4 h-4 ${report.trophy ? 'text-purple-600' : 'text-ink-400'}`} />
                  </div>
                  <p className={`font-bold tabular-nums text-sm ${report.trophy ? 'text-ink-900' : 'text-ink-400'}`}>
                    +{report.trophy ? 1 : 0}
                  </p>
                  <p className="text-[9px] text-ink-500 uppercase tracking-wider">Trophy</p>
                </div>
                <div className="text-center">
                  <div className="w-9 h-9 mx-auto rounded-xl bg-ember-500/15 flex items-center justify-center mb-1.5">
                    <Flame className="w-4 h-4 text-ember-500" />
                  </div>
                  <p className="font-bold text-ink-900 tabular-nums text-sm">{report.streak}d</p>
                  <p className="text-[9px] text-ink-500 uppercase tracking-wider">Streak</p>
                </div>
              </div>
              {report.trophy && (
                <div className="mt-3 pt-3 border-t border-ink-900/10 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-purple-600 font-bold mb-0.5">
                    Trophy Earned
                  </p>
                  <p className="text-sm font-semibold text-[#2563EB]">{report.trophy}</p>
                </div>
              )}
            </MoveXGlassPanel>

            {/* IMPACT */}
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

            {/* SENSOR EVIDENCE — always visible */}
            <MoveXGlassPanel className="mt-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Sensor Evidence
                </p>
                <p className="text-[10px] font-bold text-[#2563EB] tabular-nums">
                  {ev.gpsCount || 0} + {ev.motionCount || 0} pts
                </p>
              </div>
              <ul className="space-y-2">
                {(() => {
                  const svc = (key) => ev.permissions?.[key] || 'unknown';
                  const hasGpsData = (ev.gpsCount || 0) > 0;
                  const hasMotionData = (ev.motionCount || 0) > 0;
                  const sensorStatus = (permKey, hasData) => {
                    const perm = svc(permKey);
                    if (perm === 'denied') return 'denied';
                    if (perm === 'unavailable' || perm === 'skipped') return 'unavailable';
                    if (hasData) return 'active';
                    return 'no-data';
                  };
                  const rows = [
                    { key: 'geolocation',   label: 'GPS',           icon: MapPin,       hasData: hasGpsData,    detail: hasGpsData ? `${ev.gpsCount} pts${ev.avgAccuracy != null ? ` · ±${ev.avgAccuracy}m` : ''}` : 'No data captured' },
                    { key: 'accelerometer', label: 'Accelerometer', icon: Smartphone,   hasData: hasMotionData, detail: hasMotionData ? `${ev.motionCount} samples` : 'No data captured' },
                    { key: 'gyroscope',     label: 'Gyroscope',     icon: ActivityIcon, hasData: hasMotionData, detail: hasMotionData ? 'Rotation tracked' : 'No data captured' },
                    { key: 'magnetometer',  label: 'Compass',       icon: Compass,      hasData: hasMotionData, detail: hasMotionData ? 'Heading tracked' : 'No data captured' },
                  ];
                  return rows.map((r) => {
                    const status = sensorStatus(r.key, r.hasData);
                    const Icon = r.icon;
                    const cfg = {
                      active:      { color: 'text-mint-600',  bg: 'bg-mint-500/10',  Icon: CheckCircle2, label: 'Worked' },
                      'no-data':   { color: 'text-gold-600',  bg: 'bg-gold-500/10',  Icon: AlertTriangle, label: 'Weak' },
                      denied:      { color: 'text-red-600',   bg: 'bg-red-500/10',   Icon: XCircle,      label: 'Denied' },
                      unavailable: { color: 'text-ink-400',   bg: 'bg-surface-100',  Icon: XCircle,      label: 'N/A' },
                    }[status];
                    const StatusIcon = cfg.Icon;
                    return (
                      <li key={r.key} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-ink-900">{r.label}</p>
                          <p className="text-[10px] text-ink-500 truncate">{r.detail}</p>
                        </div>
                        <div className={`flex items-center gap-1 shrink-0 ${cfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">{cfg.label}</span>
                        </div>
                      </li>
                    );
                  });
                })()}
              </ul>
            </MoveXGlassPanel>

            {/* AVS — Athlete-Friendly Report */}
            <MoveXGlassPanel className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Verification Score
                  </p>
                  <p className="text-[10px] text-ink-500 mt-0.5">
                    How confident we are this activity is real
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#2563EB] tabular-nums leading-none">
                    {report.avs}
                    <span className="text-xs text-ink-400 font-medium">/100</span>
                  </p>
                </div>
              </div>

              {/* Score bar */}
              <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden mb-4">
                <div
                  className={`h-2 rounded-full transition-all ${
                    report.avs >= 85 ? 'bg-gradient-to-r from-mint-400 to-mint-500' :
                    report.avs >= 60 ? 'bg-gradient-to-r from-gold-400 to-gold-500' :
                    'bg-gradient-to-r from-red-400 to-red-500'
                  }`}
                  style={{ width: `${Math.max(report.avs || 0, 2)}%` }}
                />
              </div>

              {/* Steps — athlete language */}
              {report.steps.length > 0 ? (
                <ul className="space-y-1">
                  {report.steps.map((s) => {
                    const STEP_MAP = {
                      'Identity Check':              { label: 'You are you',          desc: 'Account verified' },
                      'Device Calibration':          { label: 'Phone ready',           desc: 'Sensors calibrated' },
                      'Sensor Quality':              { label: 'Sensor signal',         desc: 'GPS + motion quality' },
                      'Raw Data Collection':         { label: 'Movement recorded',     desc: 'Continuous data capture' },
                      'Data Preprocessing':          { label: 'Signal cleaned',        desc: 'Noise filtered out' },
                      'Activity Classification':     { label: 'Activity recognized',   desc: 'Type detected from motion' },
                      'Motion Pattern Verification': { label: 'Human motion verified', desc: 'Gait pattern matches activity' },
                      'GPS Validation':              { label: 'Route verified',        desc: 'Path is realistic' },
                      'Timing Validation':           { label: 'Duration valid',        desc: 'Timing is believable' },
                      'Speed Analysis':              { label: 'Speed plausible',       desc: 'Pace matches activity' },
                      'Route Analysis':              { label: 'Path realistic',        desc: 'No teleport or jump' },
                      'Heart Rate Validation':       { label: 'Heart rate valid',      desc: 'Physiology checks out' },
                    };
                    const info = STEP_MAP[s.name] || { label: s.name, desc: s.detail || '' };
                    const cfg = s.status === 'GREEN'
                      ? { color: 'text-mint-600', bg: 'bg-mint-500/10', Icon: CheckCircle2, tag: 'Pass' }
                      : s.status === 'ORANGE'
                      ? { color: 'text-gold-600', bg: 'bg-gold-500/10', Icon: AlertTriangle, tag: 'Partial' }
                      : { color: 'text-red-600', bg: 'bg-red-500/10', Icon: XCircle, tag: 'Fail' };
                    const StatusIcon = cfg.Icon;
                    return (
                      <li key={s.step} className="flex items-center gap-3 py-2 border-b border-ink-900/5 last:border-0">
                        <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-ink-900 truncate">{info.label}</p>
                          <p className="text-[10px] text-ink-500 truncate">{info.desc}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color} shrink-0`}>
                          {cfg.tag}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-ink-500">Confidence: {report.confidence}</p>
              )}

              {/* Coach tip based on score */}
              <div className={`mt-3 pt-3 border-t border-ink-900/10 flex items-start gap-2 ${
                report.avs >= 85 ? 'text-mint-700' :
                report.avs >= 60 ? 'text-gold-700' :
                'text-red-700'
              }`}>
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  {report.avs >= 85
                    ? 'Strong verification. This activity will count fully toward your Energy, XP and streak.'
                    : report.avs >= 60
                    ? 'Partial verification. Longer activities (5+ min) with GPS get higher scores.'
                    : 'Low verification. Try enabling GPS and moving outdoors for a full score.'}
                </p>
              </div>
            </MoveXGlassPanel>

            {/* ACTIONS */}
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
  // LIVE SESSION
  // ============================================================
  if (sessionActive) {
    const act = activityTypes.find((a) => a.type === selectedType);
    const ActIcon = act?.icon;
    const distanceKm = (distanceMeters / 1000).toFixed(2);
    const avgSpeed = duration > 0 ? (distanceMeters / 1000 / (duration / 3600)).toFixed(1) : '0.0';

    const SensorDot = ({ label, status }) => {
      const color =
        status === 'active'   ? 'bg-mint-500' :
        status === 'acquiring'? 'bg-gold-500 animate-pulse' :
        status === 'denied'   ? 'bg-red-500' :
        status === 'unavailable' ? 'bg-ink-300' :
        'bg-ink-300';
      return (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-ink-600">
          <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
          <span>{label}</span>
        </div>
      );
    };

    return (
      <div className="min-h-[80vh] -mx-3 sm:-mx-4 -mt-2 px-3 sm:px-4 pt-6 pb-8 bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#E0E7FF] relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#2563EB]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-md mx-auto space-y-4">
          {/* TIMER HUD */}
          <MoveXGlassPanel className="text-center py-8">
            <div className={`w-16 h-16 mx-auto rounded-2xl ${act?.bg || 'icon-tile-soft-blue'} flex items-center justify-center mb-3 shadow-lg`}>
              {ActIcon && <ActIcon className={`w-8 h-8 ${act?.accent || 'text-white'}`} />}
            </div>
            <h2 className="text-lg font-bold text-ink-900 capitalize">{act?.label}</h2>

            {/* Sensor indicators */}
            <div className="flex justify-center gap-3 mt-2 mb-5">
              <SensorDot label="GPS" status={liveSensors.gps} />
              <SensorDot label="Motion" status={liveSensors.accel} />
              <SensorDot label="Compass" status={liveSensors.mag} />
              {bandActive && <SensorDot label="Band" status="active" />}
            </div>

            <div className="text-6xl sm:text-7xl font-extrabold text-[#2563EB] tabular-nums mb-1 tracking-tight">
              {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
            </div>
            <p className="text-[10px] text-ink-500 uppercase tracking-widest font-semibold">
              {isPaused ? 'Paused' : 'Elapsed'}
            </p>
          </MoveXGlassPanel>

          {/* LIVE STATS */}
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

          {/* MANUAL DISTANCE FALLBACK */}
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

          {/* CONTROLS */}
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

  // Route Indoor Workout to the AR experience; everything else uses the normal flow
  const handleActivityClick = (type) => {
    if (type === 'workout') {
      navigate('/ar');
      return;
    }
    openPermissions(type);
  };

  // ============================================================
  // SELECTION
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* SPATIAL HERO */}
      <div className="relative hero-premium text-white rounded-hero p-5 sm:p-6 md:p-7">
        <div className="relative">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
            Start Activity
          </h1>
          <p className="text-sm md:text-base text-white/85 max-w-lg">
            Choose an activity to begin tracking. Sensors verify real movement.
          </p>
        </div>
      </div>

      {/* ACTIVITY GRID */}
      <div className="grid grid-cols-2 gap-3">
        {activityTypes.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.type}
              onClick={() => handleActivityClick(act.type)}
              className="text-left bg-white rounded-card p-4 sm:p-5 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] group"
            >
              <div className={`w-12 h-12 rounded-2xl ${act.bg} flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                <Icon className={`w-6 h-6 ${act.accent}`} />
              </div>
              <p className="text-sm sm:text-base font-semibold text-ink-900">{act.label}</p>
              <p className="text-[11px] sm:text-xs text-ink-500 mt-0.5">{act.description}</p>
              {act.type === 'workout' && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  AR Camera
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StartActivityPage;