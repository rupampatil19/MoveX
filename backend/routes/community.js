const express = require('express');
const jwt = require('jsonwebtoken');
const Community = require('../models/Community');
const RegionalContribution = require('../models/RegionalContribution');
const User = require('../models/User');

const router = express.Router();

// Authentication middleware that loads user's accountType and region
const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    const user = await User.findById(req.userId).select('accountType region');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

const PUNE_REGIONS = ['Kothrud', 'Hinjewadi', 'Baner', 'Viman Nagar', 'Hadapsar', 'Shivaji Nagar', 'Pimpri'];

// GET /api/community/all - list all regions for current user's accountType
router.get('/all', auth, async (req, res) => {
  try {
    const accountType = req.user.accountType;
    const communities = await Community.find({ accountType });
    if (communities.length === 0) {
      // Fallback with zero values for each region
      const fallback = PUNE_REGIONS.map(region => ({
        region,
        name: region,
        totalEnergy: 0,
        powerStationLevel: 1,
        communityLevel: 1,
        powerStationCurrentEnergy: 0,
        powerStationRequiredEnergy: 20000,
        membersCount: 0,
        accountType
      }));
      return res.json(fallback);
    }
    // Ensure all five regions are present
    const existingRegions = communities.map(c => c.region);
    const missing = PUNE_REGIONS.filter(r => !existingRegions.includes(r));
    const missingDocs = missing.map(region => ({
      region,
      name: region,
      totalEnergy: 0,
      powerStationLevel: 1,
      communityLevel: 1,
      powerStationCurrentEnergy: 0,
      powerStationRequiredEnergy: 20000,
      membersCount: 0,
      accountType
    }));
    res.json([...communities, ...missingDocs].sort((a, b) => b.totalEnergy - a.totalEnergy));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/community/:region - single region scoped to accountType
router.get('/:region', auth, async (req, res) => {
  try {
    const community = await Community.findOne({ region: req.params.region, accountType: req.user.accountType });
    if (!community) {
      return res.json({
        region: req.params.region,
        name: req.params.region,
        totalEnergy: 0,
        powerStationLevel: 1,
        communityLevel: 1,
        powerStationCurrentEnergy: 0,
        powerStationRequiredEnergy: 20000,
        membersCount: 0,
        accountType: req.user.accountType
      });
    }
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/community/:region/leaderboard - scoped to accountType
router.get('/:region/leaderboard', auth, async (req, res) => {
  try {
    const leaderboard = await RegionalContribution.aggregate([
      { $match: { region: req.params.region, accountType: req.user.accountType } },
      { $group: { _id: '$userId', totalAmount: { $sum: '$amount' } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { userId: '$_id', name: '$user.name', totalAmount: 1 } }
    ]);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;