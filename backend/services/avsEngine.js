// AVS Engine Service
// Contains functions for data preprocessing, classification, scoring, and AVS calculation.

// Constants (configurable)
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

// Sport baseline speed (km/h) for performance normalization
const BASELINE_SPEED = {
  running: 10,
  cycling: 20,
  walking: 5,
  workout: 0 // indoor no speed baseline
};

// Helper: clamp
function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

// Step 5: Data Preprocessing
function preprocessData(rawData) {
  // In demo/prototype, we assume rawData is already clean.
  // In a real system, remove outliers, smooth signals, etc.
  // Here we just return a copy.
  return { ...rawData };
}

// Step 6: Activity Classification (rule-based)
function classifyActivity(activityType, processedData) {
  const speed = processedData.avgSpeed || 0;
  const claimedType = activityType.toLowerCase();
  let detectedType = 'unknown';

  if (claimedType === 'running') {
    if (speed >= 7 && speed <= 18) detectedType = 'running';
    else if (speed < 7 && speed >= 4) detectedType = 'walking';
    else detectedType = 'unknown';
  } else if (claimedType === 'walking') {
    if (speed >= 3 && speed <= 8) detectedType = 'walking';
    else if (speed > 8 && speed <= 18) detectedType = 'running';
    else detectedType = 'unknown';
  } else if (claimedType === 'cycling') {
    if (speed >= 12 && speed <= 40) detectedType = 'cycling';
    else if (speed < 12 && speed >= 5) detectedType = 'walking';
    else detectedType = 'unknown';
  } else if (claimedType === 'workout') {
    // indoor workout: no speed, rely on motion/HR
    detectedType = 'workout';
  } else {
    detectedType = 'unknown';
  }
  return detectedType;
}

// Step 7: Motion Pattern Verification
function verifyMotionPattern(activityType, processedData) {
  const speed = processedData.avgSpeed || 0;
  const cadence = processedData.cadence || 0;
  let score = 0;

  if (activityType === 'running') {
    if (cadence >= 150 && cadence <= 200) score = 90;
    else if (cadence >= 120) score = 70;
    else score = 40;
  } else if (activityType === 'walking') {
    if (cadence >= 90 && cadence <= 130) score = 90;
    else if (cadence >= 70) score = 70;
    else score = 40;
  } else if (activityType === 'cycling') {
    if (cadence >= 60 && cadence <= 110) score = 90;
    else if (cadence >= 40) score = 70;
    else score = 40;
  } else if (activityType === 'workout') {
    // For workout, motion pattern is harder to define; use sensorQuality and HR
    score = processedData.dataQualityScore || 70;
  }
  return clamp(score, 0, 100);
}

// Step 8: GPS Verification
function verifyGPS(activityType, processedData) {
  const gpsPoints = processedData.gpsPoints || 0;
  const speed = processedData.avgSpeed || 0;
  // Simple rule: if enough points and speed plausible
  let score = 0;
  if (gpsPoints > 50) score = 90;
  else if (gpsPoints > 20) score = 70;
  else score = 40;

  // Check speed plausibility based on activity
  if (activityType === 'running' && speed > 20) score -= 30;
  if (activityType === 'cycling' && speed > 45) score -= 30;
  if (activityType === 'walking' && speed > 10) score -= 30;
  return clamp(score, 0, 100);
}

// Step 12: Duration Verification
function verifyDuration(activityType, durationMinutes) {
  let score = 0;
  if (durationMinutes >= 20) score = 100;
  else if (durationMinutes >= 10) score = 80;
  else if (durationMinutes >= 5) score = 50;
  else score = 20;
  return clamp(score, 0, 100);
}

// Step 13: Physiological Verification (Heart Rate)
function verifyPhysiological(activityType, processedData) {
  const hr = processedData.avgHeartRate;
  if (!hr) return { score: 50, available: false }; // neutral when unavailable

  let expectedRange = [60, 100]; // default
  if (activityType === 'running') expectedRange = [120, 180];
  else if (activityType === 'cycling') expectedRange = [110, 160];
  else if (activityType === 'walking') expectedRange = [90, 130];
  else if (activityType === 'workout') expectedRange = [100, 160];

  const [low, high] = expectedRange;
  let score = 0;
  if (hr >= low && hr <= high) score = 90;
  else if (hr < low) score = 50;
  else score = 60; // above high maybe still ok
  return { score: clamp(score, 0, 100), available: true };
}

// Step 14: Sensor Quality Score (from raw data)
function calculateSensorQualityScore(processedData) {
  const sensorQuality = processedData.sensorQuality || 70;
  const dataQualityScore = processedData.dataQualityScore || 60;
  return clamp((sensorQuality + dataQualityScore) / 2, 0, 100);
}

// Main AVS calculation
function calculateAVS(activityType, rawData) {
  const processed = preprocessData(rawData);
  const detectedType = classifyActivity(activityType, processed);
  const motionScore = verifyMotionPattern(activityType, processed);
  const gpsScore = (activityType !== 'workout') ? verifyGPS(activityType, processed) : 0;
  const durationScore = verifyDuration(activityType, rawData.duration || 0);
  const physio = verifyPhysiological(activityType, processed);
  const dataQualityScore = calculateSensorQualityScore(processed);

  // Handle missing GPS for indoor workout: redistribute weight
  let weights = { ...WEIGHTS };
  if (activityType === 'workout') {
    weights.gpsConsistency = 0;
    // Redistribute GPS weight to motion and duration proportionally
    const redistribution = weights.gpsConsistency;
    weights.motionPattern += redistribution * 0.5;
    weights.duration += redistribution * 0.3;
    weights.physiological += redistribution * 0.2;
  }

  let weightedSum = 0;
  weightedSum += motionScore * weights.motionPattern;
  if (activityType !== 'workout') {
    weightedSum += gpsScore * weights.gpsConsistency;
  }
  weightedSum += durationScore * weights.duration;
  weightedSum += physio.score * weights.physiological;
  weightedSum += dataQualityScore * weights.dataQuality;

  let avs = clamp(weightedSum, 0, 100);

  let confidence = 'LOW';
  let decision = 'INVALID';
  if (avs >= THRESHOLDS.verified) {
    confidence = 'HIGH';
    decision = 'VERIFIED';
  } else if (avs >= THRESHOLDS.probable) {
    confidence = 'MEDIUM';
    decision = 'PROBABLE';
  }

  return {
    processed,
    detectedType,
    motionScore,
    gpsScore,
    durationScore,
    physiologicalScore: physio.score,
    dataQualityScore,
    avs,
    confidence,
    decision,
    weights,
    anomalies: [] // can be filled by anti-cheat checks
  };
}

module.exports = {
  calculateAVS,
  classifyActivity,
  verifyMotionPattern,
  verifyGPS,
  verifyDuration,
  verifyPhysiological,
  calculateSensorQualityScore,
  preprocessData,
  WEIGHTS,
  THRESHOLDS,
  BASELINE_SPEED
};