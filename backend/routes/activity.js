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

// POST /api/activity - save a new activity
router.post('/', auth, async (req, res) => {
  try {
    const {
      type,
      distance,
      duration,
      activeDuration,
      pausedDuration,
      startTime,
      endTime,
      rawData,
      region
    } = req.body;

    if (!type || distance === undefined || duration === undefined) {
      return res.status(400).json({ msg: 'Type, distance and duration are required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const activity = new Activity({
      userId: req.userId,
      sessionId: `session_${Date.now()}_${req.userId}`,
      type,
      distance: Number(distance),
      duration: Number(duration),
      activeDuration: activeDuration ? Number(activeDuration) : Number(duration),
      pausedDuration: pausedDuration ? Number(pausedDuration) : 0,
      startTime: startTime || new Date(Date.now() - Number(duration) * 60000),
      endTime: endTime || new Date(),
      date: endTime || new Date(),
      region: region || user.region,
      rawData: rawData || {}
    });

    await activity.save();

    res.status(201).json({
      activity,
      user: {
        id: user._id,
        name: user.name,
        totalDistance: user.totalDistance,
        energy: user.energy,
        xp: user.xp,
        level: user.level,
        streak: user.streak
      }
    });
  } catch (err) {
    console.error('Activity save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activity/mine - get current user's activities
router.get('/mine', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.userId }).sort({ date: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;