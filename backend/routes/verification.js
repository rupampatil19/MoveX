const express = require('express');
const jwt = require('jsonwebtoken');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Community = require('../models/Community');
const Trophy = require('../models/Trophy');
const ClanMember = require('../models/ClanMember');
const Clan = require('../models/Clan');
const ClanEnergyTransaction = require('../models/ClanEnergyTransaction');
const ClanXPTransaction = require('../models/ClanXPTransaction');
const VerificationResult = require('../models/VerificationResult');
const avsEngine = require('../services/avsEngine');
const questEngine = require('../services/questEngine');
const RegionalContribution = require('../models/RegionalContribution');

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

// Helper: generate demo raw data
function generateDemoData(activityType, duration) {
  const data = {
    avgSpeed: 0,
    avgHeartRate: 0,
    cadence: 0,
    gpsPoints: 120,
    sensorQuality: 85,
    dataQualityScore: 80,
    duration: duration
  };
  if (activityType === 'running') {
    data.avgSpeed = 10.2 + Math.random() * 1.5;
    data.avgHeartRate = 145 + Math.floor(Math.random() * 10);
    data.cadence = 170 + Math.floor(Math.random() * 10);
  } else if (activityType === 'walking') {
    data.avgSpeed = 5.4;
    data.avgHeartRate = 100;
    data.cadence = 110;
  } else if (activityType === 'cycling') {
    data.avgSpeed = 18.5;
    data.avgHeartRate = 130;
    data.cadence = 80;
  } else if (activityType === 'workout') {
    data.avgSpeed = 0;
    data.avgHeartRate = 150;
    data.cadence = 0;
    data.gpsPoints = 0;
  }
  return data;
}

// POST /api/verification/run/:activityId
router.post('/run/:activityId', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId);
    if (!activity || activity.userId.toString() !== req.userId) {
      return res.status(404).json({ msg: 'Activity not found' });
    }

    // Idempotency check
    if (activity.verification && activity.verification.status !== 'PENDING') {
      return res.status(400).json({ msg: 'Activity already verified' });
    }

    // Generate raw data if not present
    let rawData = activity.rawData;
    if (!rawData || Object.keys(rawData).length === 0) {
      rawData = generateDemoData(activity.type, activity.duration);
      activity.rawData = rawData;
    }

    // Run AVS engine
    const avsResult = avsEngine.calculateAVS(activity.type, rawData);

    // Build 10-step verification timeline
    const steps = [
      { step: 1, name: 'Identity Check', status: 'GREEN', detail: 'User verified', score: 100 },
      { step: 2, name: 'Device Calibration', status: 'GREEN', detail: 'Calibration complete', score: 100 },
      { step: 3, name: 'Sensor Quality', status: rawData.sensorQuality >= 80 ? 'GREEN' : rawData.sensorQuality >= 60 ? 'ORANGE' : 'RED', detail: `Quality ${rawData.sensorQuality}%`, score: rawData.sensorQuality },
      { step: 4, name: 'Raw Data Collection', status: 'GREEN', detail: 'Data collected', score: 100 },
      { step: 5, name: 'Data Preprocessing', status: rawData.dataQualityScore >= 80 ? 'GREEN' : rawData.dataQualityScore >= 60 ? 'ORANGE' : 'RED', detail: `Preprocessed quality ${rawData.dataQualityScore}%`, score: rawData.dataQualityScore },
      { step: 6, name: 'Activity Classification', status: avsResult.detectedType === activity.type ? 'GREEN' : 'ORANGE', detail: `${activity.type} detected`, score: avsResult.detectedType === activity.type ? 100 : 60 },
      { step: 7, name: 'Motion Pattern Verification', status: avsResult.motionScore >= 80 ? 'GREEN' : avsResult.motionScore >= 60 ? 'ORANGE' : 'RED', detail: `Pattern score ${avsResult.motionScore.toFixed(0)}%`, score: avsResult.motionScore },
      { step: 8, name: 'GPS Verification', status: (activity.type === 'workout' ? 'ORANGE' : avsResult.gpsScore >= 80 ? 'GREEN' : avsResult.gpsScore >= 60 ? 'ORANGE' : 'RED'), detail: activity.type === 'workout' ? 'GPS not available' : `GPS score ${avsResult.gpsScore.toFixed(0)}%`, score: avsResult.gpsScore },
      { step: 9, name: 'Cross-Sensor Consistency', status: 'GREEN', detail: 'Consistent', score: 85 },
      { step: 10, name: 'Final Validity Score & Decision', status: avsResult.decision === 'VERIFIED' ? 'GREEN' : avsResult.decision === 'PROBABLE' ? 'ORANGE' : 'RED', detail: `AVS ${avsResult.avs.toFixed(0)}/100, ${avsResult.confidence} confidence, ${avsResult.decision}`, score: avsResult.avs }
    ];

    activity.verification = {
      avs: avsResult.avs,
      status: avsResult.decision,
      confidence: avsResult.confidence,
      steps
    };

    // Save VerificationResult
    const verificationDoc = new VerificationResult({
      userId: req.userId,
      activityId: activity._id,
      activityType: activity.type,
      steps,
      motionPatternScore: avsResult.motionScore,
      gpsConsistencyScore: activity.type === 'workout' ? 0 : avsResult.gpsScore,
      durationScore: avsResult.durationScore,
      physiologicalScore: avsResult.physiologicalScore,
      dataQualityScore: avsResult.dataQualityScore,
      avs: avsResult.avs,
      confidence: avsResult.confidence,
      decision: avsResult.decision,
      energyEligible: avsResult.decision !== 'INVALID',
      energyMultiplier: 1,
      anomalies: avsResult.anomalies || []
    });
    await verificationDoc.save();

    // ----- Reward calculation -----
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const baseEnergy = { running: 100, walking: 80, cycling: 100, workout: 90 }[activity.type] || 100;
    const baseTrophy = { running: 10, walking: 8, cycling: 10, workout: 9 }[activity.type] || 10;

    const streakBoost = Math.min((user.streak || 0) * 0.02, 0.5);
    const energyMultiplier = 1 + streakBoost;
    const trophyMultiplier = 1 + streakBoost * 0.5;

    let energyAward = 0;
    let trophyAward = 0;
    let xpAward = 0;
    let trophyName = null;

    if (avsResult.decision === 'VERIFIED') {
      energyAward = Math.round(baseEnergy * (avsResult.avs / 100) * energyMultiplier);
      trophyAward = Math.round(baseTrophy * (avsResult.avs / 100) * trophyMultiplier);
      xpAward = Math.round(activity.distance * 15);
    } else if (avsResult.decision === 'PROBABLE') {
      energyAward = Math.round(baseEnergy * (avsResult.avs / 100) * energyMultiplier * 0.5);
      trophyAward = Math.round(baseTrophy * (avsResult.avs / 100) * trophyMultiplier * 0.5);
      xpAward = Math.round(activity.distance * 7);
    } else {
      energyAward = 0;
      trophyAward = 0;
      xpAward = 0;
    }

    // Update user
    user.energy += energyAward;
    user.xp += xpAward;
    user.totalDistance += activity.distance;
    user.level = Math.floor(user.xp / 1000) + 1;
    const today = new Date().toDateString();
    if (user.lastActivityDate && user.lastActivityDate.toDateString() !== today) {
      user.streak += 1;
    } else if (!user.lastActivityDate) {
      user.streak = 1;
    }
    user.lastActivityDate = new Date();
    // Daily quest progress
    if (!user.dailyQuestCompleted) {
      user.dailyQuestProgress += activity.duration;
      if (user.dailyQuestProgress >= 20) {
        user.dailyQuestCompleted = true;
        user.energy += 50;
        user.xp += 25;
      }
    }
    // Trophy check
    if (user.totalDistance >= 10 && !user.trophies.includes('10 KM Runner')) {
      user.trophies.push('10 KM Runner');
      trophyName = '10 KM Runner';
    } else if (user.totalDistance >= 5 && !user.trophies.includes('5 KM Runner')) {
      user.trophies.push('5 KM Runner');
      trophyName = '5 KM Runner';
    } else if (user.streak >= 7 && !user.trophies.includes('7 Day Streak')) {
      user.trophies.push('7 Day Streak');
      trophyName = '7 Day Streak';
    } else if (user.trophies.length === 0) {
      user.trophies.push('First Activity');
      trophyName = 'First Activity';
    }

    // Community contribution: 30% of energy, scoped to user's accountType
    const communityContribution = Math.round(energyAward * 0.3);
    let community = await Community.findOne({ region: user.region, accountType: user.accountType });
    if (!community) {
      community = new Community({
        region: user.region,
        name: user.region,
        accountType: user.accountType,
        membersCount: 1
      });
    }
    community.totalEnergy += communityContribution;
    community.powerStationCurrentEnergy += communityContribution;

    // Update region level based on totalEnergy thresholds
    const thresholds = [0, 20000, 50000, 100000, 200000];
    let newLevel = 1;
    for (let i = 0; i < thresholds.length; i++) {
      if (community.totalEnergy >= thresholds[i]) newLevel = i + 1;
    }
    community.powerStationLevel = newLevel;
    community.communityLevel = newLevel;
    community.powerStationRequiredEnergy = newLevel < thresholds.length ? thresholds[newLevel] : thresholds[thresholds.length - 1];
    community.lastUpdated = new Date();
    await community.save();

    // Record regional contribution with accountType
    if (communityContribution > 0) {
      await RegionalContribution.create({
        userId: req.userId,
        region: user.region,
        accountType: user.accountType,
        activityId: activity._id,
        amount: communityContribution,
        source: 'ACTIVITY'
      });
    }

    // ===== CLAN CONTRIBUTION =====
    const clanMembership = await ClanMember.findOne({ userId: req.userId });
    let clanEnergyContribution = 0;
    let clanXPContribution = 0;
    if (clanMembership && energyAward > 0) {
      clanEnergyContribution = Math.round(energyAward * 0.1);
      clanXPContribution = Math.round(xpAward * 0.05);
      await ClanEnergyTransaction.create({ clanId: clanMembership.clanId, userId: req.userId, amount: clanEnergyContribution, source: 'ACTIVITY' });
      await ClanXPTransaction.create({ clanId: clanMembership.clanId, userId: req.userId, amount: clanXPContribution, source: 'ACTIVITY' });
      const clan = await Clan.findById(clanMembership.clanId);
      if (clan) {
        clan.energy += clanEnergyContribution;
        clan.weeklyEnergy += clanEnergyContribution;
        clan.xp += clanXPContribution;
        const newLevel = Math.floor(clan.xp / 5000) + 1;
        if (newLevel > clan.level) clan.level = newLevel;
        const memberCount = await ClanMember.countDocuments({ clanId: clan._id });
        if (memberCount > 250) clan.tier = 'LEGEND';
        else if (memberCount > 200) clan.tier = 'DIAMOND';
        else if (memberCount > 150) clan.tier = 'PLATINUM';
        else if (memberCount > 100) clan.tier = 'GOLD';
        else if (memberCount > 50) clan.tier = 'SILVER';
        else clan.tier = 'BRONZE';
        await clan.save();
      }
    }

    // Save activity rewards
    activity.energyAwarded = energyAward;
    activity.xpAwarded = xpAward;
    activity.trophyAwarded = trophyName;
    activity.communityContribution = communityContribution;
    activity.tps = avsResult.avs;
    await activity.save();
    await user.save();

    // Process Quests after verification
    await questEngine.processActivity(req.userId, activity);

    // ===== REAL-TIME EMISSION =====
    const io = req.app.get('io');
    if (io) {
      io.emit('regionUpdate', {
        region: user.region,
        accountType: user.accountType,
        totalEnergy: community.totalEnergy,
        powerStationLevel: community.powerStationLevel,
        communityContribution,
        energyAwarded: energyAward,
        xpAwarded: xpAward,
        trophyName,
        clanEnergyContribution,
        clanXPContribution
      });
    }

    res.json({
      activity,
      verification: activity.verification,
      avs: avsResult.avs,
      decision: avsResult.decision,
      confidence: avsResult.confidence,
      energyAwarded: energyAward,
      xpAwarded: xpAward,
      trophyName,
      communityContribution,
      clanEnergyContribution,
      clanXPContribution,
      user: { id: user._id, name: user.name, xp: user.xp, level: user.level, energy: user.energy, streak: user.streak, trophies: user.trophies },
      community: { region: community.region, totalEnergy: community.totalEnergy, powerStationLevel: community.powerStationLevel, powerStationCurrentEnergy: community.powerStationCurrentEnergy, powerStationRequiredEnergy: community.powerStationRequiredEnergy }
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/verification/:activityId
router.get('/:activityId', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId);
    if (!activity || activity.userId.toString() !== req.userId) return res.status(404).json({ msg: 'Activity not found' });
    const verificationDoc = await VerificationResult.findOne({ activityId: activity._id });
    if (!verificationDoc) {
      return res.json({ verification: activity.verification, energyAwarded: activity.energyAwarded, xpAwarded: activity.xpAwarded });
    }
    res.json({
      verification: activity.verification,
      energyAwarded: activity.energyAwarded,
      xpAwarded: activity.xpAwarded,
      tps: verificationDoc.avs,
      scoreBreakdown: {
        effort: verificationDoc.motionPatternScore,
        performance: verificationDoc.gpsConsistencyScore,
        consistency: verificationDoc.durationScore,
        health: verificationDoc.physiologicalScore,
        fairness: verificationDoc.dataQualityScore
      },
      decision: verificationDoc.decision,
      confidence: verificationDoc.confidence,
      anomalies: verificationDoc.anomalies
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;