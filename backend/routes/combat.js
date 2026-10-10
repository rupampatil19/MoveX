/**
 * combat.js
 * Read-only endpoints for combat session history, detail, and leaderboard.
 * Write path is POST /api/activity — the activity route dual-writes CombatSession.
 *
 * Uses the same inline auth pattern as leaderboard.js and activity.js.
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const CombatSession = require('../models/CombatSession');

// ------------------------------------------------------------
// Inline auth — matches the pattern used in leaderboard.js / activity.js
// ------------------------------------------------------------
const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ ok: false, msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    const user = await User.findById(req.userId).select('accountType region cityId stateId name');
    if (!user) return res.status(404).json({ ok: false, msg: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    console.error('[combat auth]', err.message);
    res.status(401).json({ ok: false, msg: 'Invalid token' });
  }
};

// ------------------------------------------------------------
// GET /api/combat/sessions?discipline=boxing&limit=20
// ------------------------------------------------------------
router.get('/sessions', auth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const filter = { userId: req.user._id };
    if (req.query.discipline) filter.discipline = req.query.discipline;

    const sessions = await CombatSession
      .find(filter)
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();

    res.json({ ok: true, count: sessions.length, sessions });
  } catch (err) {
    console.error('[combat/sessions]', err.message);
    res.status(500).json({ ok: false, msg: 'Failed to load sessions' });
  }
});

// ------------------------------------------------------------
// GET /api/combat/session/:id
// ------------------------------------------------------------
router.get('/session/:id', auth, async (req, res) => {
  try {
    const session = await CombatSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();
    if (!session) return res.status(404).json({ ok: false, msg: 'Not found' });
    res.json({ ok: true, session });
  } catch (err) {
    console.error('[combat/session]', err.message);
    res.status(500).json({ ok: false, msg: 'Failed to load session' });
  }
});

// ------------------------------------------------------------
// GET /api/combat/personal-bests
// ------------------------------------------------------------
router.get('/personal-bests', auth, async (req, res) => {
  try {
    const rows = await CombatSession.aggregate([
      { $match: { userId: req.user._id } },
      { $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalStrikes: { $sum: '$totals.strikes' },
        maxStrikesPerRound: { $max: { $max: '$rounds.strikes' } },
        maxHardestImpact: { $max: '$totals.hardestImpact' },
        maxConditioning: { $max: '$totals.conditioningIndex' },
        bestAvgRate: { $max: '$totals.avgStrikeRate' },
      } },
    ]);
    res.json({ ok: true, bests: rows[0] || {} });
  } catch (err) {
    console.error('[combat/personal-bests]', err.message);
    res.status(500).json({ ok: false, msg: 'Failed to compute' });
  }
});

// ------------------------------------------------------------
// GET /api/combat/leaderboard/:discipline?days=30&limit=10
// ------------------------------------------------------------
router.get('/leaderboard/:discipline', auth, async (req, res) => {
  try {
    const { discipline } = req.params;
    const days = Math.min(Number(req.query.days) || 30, 365);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const top = await CombatSession
      .find({ discipline, startedAt: { $gte: since } })
      .sort({ 'totals.conditioningIndex': -1, 'totals.hardestImpact': -1 })
      .limit(limit)
      .populate('userId', 'name city region')
      .lean();

    res.json({ ok: true, discipline, windowDays: days, leaderboard: top });
  } catch (err) {
    console.error('[combat/leaderboard]', err.message);
    res.status(500).json({ ok: false, msg: 'Failed to load leaderboard' });
  }
});

module.exports = router;