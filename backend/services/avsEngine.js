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

function calculateAVS(activityType, rawData) {
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