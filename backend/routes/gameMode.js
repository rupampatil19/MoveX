const express = require('express');
const jwt = require('jsonwebtoken');
const GameModePreference = require('../models/GameModePreference');

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

// GET current mode
router.get('/', auth, async (req, res) => {
  try {
    let pref = await GameModePreference.findOne({ userId: req.userId });
    if (!pref) {
      pref = new GameModePreference({ userId: req.userId });
      await pref.save();
    }
    res.json({ mode: pref.mode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST select mode
router.post('/select', auth, async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['CLASSIC', 'FOCUS'].includes(mode)) return res.status(400).json({ msg: 'Invalid mode' });
    let pref = await GameModePreference.findOne({ userId: req.userId });
    if (!pref) pref = new GameModePreference({ userId: req.userId });
    pref.mode = mode;
    pref.updatedAt = new Date();
    await pref.save();
    res.json({ mode: pref.mode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;