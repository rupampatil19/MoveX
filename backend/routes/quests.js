const express = require('express');
const jwt = require('jsonwebtoken');
const Quest = require('../models/Quest');
const UserQuest = require('../models/UserQuest');
const { seedQuestsIfEmpty, seedUserQuests, claimReward } = require('../services/questEngine');

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

// GET /api/quests - get all active quests for user with progress
router.get('/', auth, async (req, res) => {
  try {
    await seedQuestsIfEmpty(); // seed if no quests exist
    await seedUserQuests(req.userId);
    const userQuests = await UserQuest.find({ userId: req.userId })
      .populate('questId')
      .sort({ 'questId.category': 1, 'questId.endTime': 1 });
    res.json(userQuests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quests/:id - get single quest details
router.get('/:id', auth, async (req, res) => {
  try {
    const userQuest = await UserQuest.findOne({ _id: req.params.id, userId: req.userId })
      .populate('questId');
    if (!userQuest) return res.status(404).json({ msg: 'Quest not found' });
    res.json(userQuest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quests/:id/claim - claim reward for completed quest
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const result = await claimReward(req.userId, req.params.id);
    res.json({ success: true, reward: result.reward, user: result.user });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

module.exports = router;