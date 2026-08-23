const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Community = require('../models/Community');
const VerificationResult = require('../models/VerificationResult');

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

// GET /api/movex-system/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Latest activity
    const recentActivity = await Activity.findOne({ userId: req.userId }).sort({ date: -1 });

    // Latest verification result
    const latestVerification = recentActivity
      ? await VerificationResult.findOne({ activityId: recentActivity._id })
      : null;

    // Community
    const community = await Community.findOne({ region: user.region });

    // Community contribution from latest activity (30% of energyAwarded)
    const communityContribution = recentActivity?.communityContribution || 0;

    const response = {
      user: {
        id: user._id,
        name: user.name,
        level: user.level,
        xp: user.xp,
        energy: user.energy,
        streak: user.streak,
        trophies: user.trophies,
        totalDistance: user.totalDistance
      },
      recentActivity: recentActivity
        ? {
            type: recentActivity.type,
            distance: recentActivity.distance,
            duration: recentActivity.duration,
            date: recentActivity.date,
            energyAwarded: recentActivity.energyAwarded,
            xpAwarded: recentActivity.xpAwarded,
            trophyAwarded: recentActivity.trophyAwarded,
            communityContribution: recentActivity.communityContribution
          }
        : null,
      verification: latestVerification
        ? {
            avs: latestVerification.avs,
            decision: latestVerification.decision,
            confidence: latestVerification.confidence
          }
        : null,
      community: community
        ? {
            region: community.region,
            name: community.name,
            totalEnergy: community.totalEnergy,
            powerStationLevel: community.powerStationLevel,
            communityLevel: community.communityLevel,
            powerStationCurrentEnergy: community.powerStationCurrentEnergy,
            powerStationRequiredEnergy: community.powerStationRequiredEnergy,
            membersCount: community.membersCount,
            communityContribution // personal contribution from latest activity
          }
        : {
            region: user.region,
            name: user.region,
            totalEnergy: 0,
            powerStationLevel: 1,
            communityLevel: 1,
            powerStationCurrentEnergy: 0,
            powerStationRequiredEnergy: 10000,
            membersCount: 0,
            communityContribution: 0
          }
    };

    res.json(response);
  } catch (err) {
    console.error('MoveX System Summary Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;