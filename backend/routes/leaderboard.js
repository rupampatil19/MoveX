const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Auth middleware that loads user's accountType and region
const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    const user = await User.findById(req.userId).select('accountType region');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// GET /api/leaderboard - global scoped to current user's accountType
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ accountType: req.user.accountType })
      .select('name region totalDistance level xp energy trophies streak')
      .sort({ level: -1, totalDistance: -1 })
      .limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaderboard/region/:region - regional scoped to current user's accountType
router.get('/region/:region', auth, async (req, res) => {
  try {
    const region = req.params.region === 'All' ? req.user.region : req.params.region;
    const users = await User.find({ region, accountType: req.user.accountType })
      .select('name region totalDistance level xp energy trophies streak')
      .sort({ energy: -1, xp: -1, level: -1, totalDistance: -1 })
      .limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;