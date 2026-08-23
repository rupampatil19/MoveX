const express = require('express');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

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

// GET notifications for user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET unread count
router.get('/unread', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.userId, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark single as read
router.post('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE notification
router.delete('/:id', auth, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    let prefs = await NotificationPreference.findOne({ userId: req.userId });
    if (!prefs) prefs = new NotificationPreference({ userId: req.userId });
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    let prefs = await NotificationPreference.findOne({ userId: req.userId });
    if (!prefs) prefs = new NotificationPreference({ userId: req.userId });
    Object.assign(prefs, req.body);
    await prefs.save();
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;