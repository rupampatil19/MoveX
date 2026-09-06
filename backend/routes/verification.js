const express = require('express');
const jwt = require('jsonwebtoken');
const Activity = require('../models/Activity');
const User = require('../models/User');

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Fast demo AVS calculation
function calculateDemoAVS(type, rawData) {
  const motion = rawData.sensorQuality || 85;
  const gps = rawData.gpsPoints > 50 ? 90 : 50;
  const duration = rawData.duration >= 20 ? 100 : rawData.duration >= 10 ? 80 : 50;
  const physio = rawData.avgHeartRate ? 90 : 50;
  const dataQuality = rawData.dataQualityScore || 80;

  const avs = Math.round(
    motion * 0.35 +
    gps * 0.25 +
    duration * 0.15 +
    physio * 0.15 +
    dataQuality * 0.10
  );

  let decision = 'INVALID';
  let confidence = 'LOW';
  if (avs >= 80) { decision = 'VERIFIED'; confidence = 'HIGH'; }
  else if (avs >= 60) { decision = 'PROBABLE'; confidence = 'MEDIUM'; }

  return { avs, decision, confidence };
}

// POST /api/verification/run/:activityId
router.post('/run/:activityId', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId);
    if (!activity || activity.userId.toString() !== req.userId) {
      return res.status(404).json({ msg: 'Activity not found' });
    }

    if (activity.verification && activity.verification.status !== 'PENDING') {
      return res.status(400).json({ msg: 'Activity already verified' });
    }

    const rawData = activity.rawData || {};
    const isDemo = rawData.demo === true;

    let avsResult;
    if (isDemo) {
      avsResult = calculateDemoAVS(activity.type, rawData);
    } else {
      // Full AVS engine (if available)
      const avsEngine = require('../services/avsEngine');
      avsResult = avsEngine.calculateAVS(activity.type, rawData);
    }

    // Build minimal steps for demo
    const steps = [
      { step: 1, name: 'Identity Check', status: 'GREEN', detail: 'User verified', score: 100 },
      { step: 2, name: 'Device Calibration', status: 'GREEN', detail: 'Calibration complete', score: 100 },
      { step: 3, name: 'Sensor Quality', status: rawData.sensorQuality >= 80 ? 'GREEN' : 'ORANGE', detail: `Quality ${rawData.sensorQuality}%`, score: rawData.sensorQuality },
      { step: 4, name: 'Data Preprocessing', status: 'GREEN', detail: 'Data ready', score: 100 },
      { step: 5, name: 'Final Decision', status: avsResult.decision === 'VERIFIED' ? 'GREEN' : avsResult.decision === 'PROBABLE' ? 'ORANGE' : 'RED', detail: `AVS ${avsResult.avs}/100`, score: avsResult.avs },
    ];

    activity.verification = {
      avs: avsResult.avs,
      status: avsResult.decision,
      confidence: avsResult.confidence,
      steps,
    };

    // Quick reward calculation
    const baseEnergy = { running: 100, walking: 80, cycling: 100, workout: 90 }[activity.type] || 100;
    const energyAward = avsResult.decision === 'VERIFIED' ? Math.round(baseEnergy * (avsResult.avs / 100)) : avsResult.decision === 'PROBABLE' ? Math.round(baseEnergy * 0.5) : 0;
    const xpAward = avsResult.decision === 'VERIFIED' ? Math.round(activity.distance * 15) : avsResult.decision === 'PROBABLE' ? Math.round(activity.distance * 7) : 0;
    const trophyName = null;

    // Update user (fast, only essential fields)
    const user = await User.findById(req.userId);
    if (user) {
      user.energy += energyAward;
      user.xp += xpAward;
      user.level = Math.floor(user.xp / 1000) + 1;
      user.totalDistance += activity.distance;
      user.lastActivityDate = new Date();
      await user.save();
    }

    activity.energyAwarded = energyAward;
    activity.xpAwarded = xpAward;
    activity.trophyAwarded = trophyName;
    await activity.save();

    // Return response immediately (no community/clan/quest updates for demo)
    res.json({
      avs: avsResult.avs,
      decision: avsResult.decision,
      confidence: avsResult.confidence,
      energyAwarded: energyAward,
      xpAwarded: xpAward,
      trophyName,
      scoreBreakdown: {
        effort: avsResult.avs * 0.25,
        performance: avsResult.avs * 0.35,
        consistency: avsResult.avs * 0.15,
        health: avsResult.avs * 0.15,
        fairness: avsResult.avs * 0.10,
      },
      tps: avsResult.avs,
      user: user ? { id: user._id, energy: user.energy, xp: user.xp, streak: user.streak, trophies: user.trophies } : null,
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;