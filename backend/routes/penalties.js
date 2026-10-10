const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const Penalty = require('../models/Penalty');
const Strike = require('../models/Strike');
const StreakFreeze = require('../models/StreakFreeze');
const PenaltyNotification = require('../models/PenaltyNotification');
const WinBackState = require('../models/WinBackState');

const penaltyEngine = require('../services/penaltyEngine');
const winBackService = require('../services/winBackService');

const router = express.Router();

// ------------------------------------------------------------
// AUTH MIDDLEWARE
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// GET /me — full current penalty state
// ------------------------------------------------------------
router.get('/me', auth, async (req, res) => {
  try {
    const now = new Date();

    const [activePenalties, activeStrikes, freeze, effects, user] = await Promise.all([
      Penalty.find({
        userId: req.userId,
        resolved: false,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      }).sort({ appliedAt: -1 }).lean(),
      Strike.find({
        userId: req.userId,
        resolved: false,
        expiresAt: { $gt: now },
      }).sort({ appliedAt: -1 }).lean(),
      StreakFreeze.findOne({ userId: req.userId }).lean(),
      penaltyEngine.getActiveEffects(req.userId),
      User.findById(req.userId).select('xpBoostRemaining').lean(),
    ]);

    res.json({
      penalties: activePenalties,
      strikes: activeStrikes,
      strikeCount: activeStrikes.length,
      strikeLimit: 4,
      freeze: {
        available: freeze?.available || 0,
        max: 3,
        lastEarnedAt: freeze?.lastEarnedAt || null,
      },
      effects,
      xpBoostRemaining: user?.xpBoostRemaining || 0,
    });
  } catch (err) {
    console.error('GET /penalties/me error:', err);
    res.status(500).json({ error: 'Failed to load penalty state' });
  }
});

// ------------------------------------------------------------
// GET /history — all past penalties + resolved strikes
// ------------------------------------------------------------
router.get('/history', auth, async (req, res) => {
  try {
    const [penalties, strikes] = await Promise.all([
      Penalty.find({ userId: req.userId })
        .sort({ appliedAt: -1 })
        .limit(50)
        .lean(),
      Strike.find({ userId: req.userId })
        .sort({ appliedAt: -1 })
        .limit(50)
        .lean(),
    ]);

    res.json({ penalties, strikes });
  } catch (err) {
    console.error('GET /penalties/history error:', err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// ------------------------------------------------------------
// GET /notifications — unread + visible notifications
// ------------------------------------------------------------
router.get('/notifications', auth, async (req, res) => {
  try {
    const now = new Date();
    const notifications = await PenaltyNotification.find({
      userId: req.userId,
      dismissed: false,
      $or: [{ snoozedUntil: null }, { snoozedUntil: { $lte: now } }],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('GET /penalties/notifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// ------------------------------------------------------------
// POST /notifications/:id/read
// ------------------------------------------------------------
router.post('/notifications/:id/read', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }
    await PenaltyNotification.updateOne(
      { _id: req.params.id, userId: req.userId },
      { $set: { read: true, readAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ------------------------------------------------------------
// POST /notifications/:id/dismiss
// ------------------------------------------------------------
router.post('/notifications/:id/dismiss', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }
    await PenaltyNotification.updateOne(
      { _id: req.params.id, userId: req.userId },
      { $set: { dismissed: true, dismissedAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to dismiss' });
  }
});

// ------------------------------------------------------------
// POST /notifications/:id/snooze — body: { hours: 24 }
// ------------------------------------------------------------
router.post('/notifications/:id/snooze', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }
    const hours = Math.max(1, Math.min(168, Number(req.body?.hours) || 24));
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    await PenaltyNotification.updateOne(
      { _id: req.params.id, userId: req.userId },
      { $set: { snoozedUntil: until, read: true, readAt: new Date() } }
    );
    res.json({ ok: true, snoozedUntil: until });
  } catch (err) {
    res.status(500).json({ error: 'Failed to snooze' });
  }
});

// ------------------------------------------------------------
// GET /bazaar-status — is Bazaar locked behind rewards gate?
// ------------------------------------------------------------
router.get('/bazaar-status', auth, async (req, res) => {
  try {
    const status = await winBackService.isBazaarUnlocked(req.userId);
    res.json(status);
  } catch (err) {
    console.error('GET /penalties/bazaar-status error:', err);
    res.status(500).json({ error: 'Failed to check bazaar status' });
  }
});

// ------------------------------------------------------------
// GET /winback-status — dormancy + gate state
// ------------------------------------------------------------
router.get('/winback-status', auth, async (req, res) => {
  try {
    const state = await WinBackState.findOne({ userId: req.userId }).lean();
    if (!state) {
      return res.json({
        isDormant: false,
        winBackClaimed: false,
        gateActive: false,
        gateProgress: 0,
        target: 7,
      });
    }
    res.json({
      isDormant: state.isDormant,
      dormantSince: state.dormantSince,
      winBackClaimed: state.winBackClaimed,
      winBackClaimedAt: state.winBackClaimedAt,
      gateActive: state.gateActive,
      gateProgress: state.gateProgress || 0,
      target: 7,
      gateUnlockedAt: state.gateUnlockedAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check winback status' });
  }
});

// ------------------------------------------------------------
// POST /detect-return — called by frontend on app load
// ------------------------------------------------------------
router.post('/detect-return', auth, async (req, res) => {
  try {
    const result = await winBackService.detectReturn(req.userId);
    res.json(result);
  } catch (err) {
    console.error('POST /penalties/detect-return error:', err);
    res.status(500).json({ error: 'Failed to detect return' });
  }
});

// ------------------------------------------------------------
// POST /claim-welcome — claim Welcome Kit
// ------------------------------------------------------------
router.post('/claim-welcome', auth, async (req, res) => {
  try {
    const result = await winBackService.claimWelcomeKit(req.userId);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (err) {
    console.error('POST /penalties/claim-welcome error:', err);
    res.status(500).json({ error: 'Failed to claim Welcome Kit' });
  }
});

// ------------------------------------------------------------
// POST /evaluate-me — manual trigger (for testing)
// ------------------------------------------------------------
router.post('/evaluate-me', auth, async (req, res) => {
  try {
    const result = await penaltyEngine.evaluateUser(req.userId);
    res.json(result);
  } catch (err) {
    console.error('POST /penalties/evaluate-me error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;