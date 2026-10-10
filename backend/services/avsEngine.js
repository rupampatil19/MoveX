/**
 * AVS (Activity Verification Score) engine.
 *
 * Two paths:
 *  1. GPS activities (running/walking/cycling/workout) — original scoring
 *  2. AR workouts (rawData.source === 'ar') — pose-engine scoring
 */

const WEIGHTS = {
  motionPattern: 0.35,
  gpsConsistency: 0.25,
  duration: 0.15,
  physiological: 0.15,
  dataQuality: 0.10
};

const THRESHOLDS = {
  verified: 80,
  probable: 60
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

/**
 * AR-specific scoring. The pose engine already did the "verification" work
 * (real-time form checks, rep counting), so we score based on:
 *  - accuracy of the reps as scored by the analyzers
 *  - whether they hit the target rep count
 *  - session length (abandoned sets are penalized)
 *  - number of partial (unscored) attempts
 */
function calculateARAVS(ar) {
  const accuracy = clamp(ar.accuracy ?? 0);
  const reps = ar.reps ?? 0;
  const target = ar.target ?? 0;
  const durationSec = ar.durationSec ?? 0;
  const partials = ar.partials ?? 0;

  // Base AVS from accuracy
  let avs = 40 + accuracy * 0.55; // 40..95

  // Rep-target bonus (max +6)
  if (target > 0) {
    const ratio = Math.min(reps / target, 1.2);
    if (ratio >= 1) avs += 6;
    else if (ratio >= 0.7) avs += 3;
    else if (ratio < 0.3) avs -= 8;
  }

  // Session length
  if (durationSec >= 60) avs += 3;
  if (durationSec < 20) avs -= 10;

  // Partials penalty
  avs -= Math.min(partials, 5) * 2;

  // Very few reps → unreliable signal
  if (reps < 3) avs -= 15;
  else if (reps < 5) avs -= 6;

  avs = Math.round(clamp(avs));

  let confidence = 'LOW';
  let decision = 'INVALID';
  if (avs >= THRESHOLDS.verified) { confidence = 'HIGH'; decision = 'VERIFIED'; }
  else if (avs >= THRESHOLDS.probable) { confidence = 'MEDIUM'; decision = 'PROBABLE'; }

  return {
    avs,
    confidence,
    decision,
    motionScore: avs,                    // pose-engine accuracy IS the motion signal
    gpsScore: 100,                       // not applicable — treat as satisfied
    durationScore: durationSec >= 60 ? 100 : durationSec >= 30 ? 80 : 60,
    physiologicalScore: accuracy >= 75 ? 90 : 60,
    dataQualityScore: accuracy,
    detectedType: 'ar',
    ar: {
      exercise: ar.exercise,
      reps,
      target,
      accuracy,
      durationSec,
      partials,
    },
  };
}

function calculateAVS(activityType, rawData) {
  // ---- AR branch ----
  if (rawData && rawData.source === 'ar' && rawData.ar) {
    return calculateARAVS(rawData.ar);
  }

  // ---- GPS / standard branch (original logic) ----
  const motionScore = activityType === 'workout' ? (rawData.sensorQuality || 70) : 85;
  const gpsScore = activityType === 'workout' ? 0 : (rawData.gpsPoints > 50 ? 90 : 50);
  const durationScore = rawData.duration >= 20 ? 100 : rawData.duration >= 10 ? 80 : 50;
  const physiologicalScore = rawData.avgHeartRate ? 90 : 50;
  const dataQualityScore = rawData.dataQualityScore || 60;

  let avs = motionScore * WEIGHTS.motionPattern
          + gpsScore * WEIGHTS.gpsConsistency
          + durationScore * WEIGHTS.duration
          + physiologicalScore * WEIGHTS.physiological
          + dataQualityScore * WEIGHTS.dataQuality;

  avs = Math.round(clamp(avs));

  let confidence = 'LOW';
  let decision = 'INVALID';
  if (avs >= THRESHOLDS.verified) { confidence = 'HIGH'; decision = 'VERIFIED'; }
  else if (avs >= THRESHOLDS.probable) { confidence = 'MEDIUM'; decision = 'PROBABLE'; }

  return {
    avs,
    confidence,
    decision,
    motionScore,
    gpsScore,
    durationScore,
    physiologicalScore,
    dataQualityScore,
    detectedType: activityType
  };
}

module.exports = { calculateAVS };