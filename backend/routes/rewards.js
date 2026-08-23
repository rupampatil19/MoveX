const express = require('express');
const jwt = require('jsonwebtoken');
const Reward = require('../models/Reward');
const RewardInventory = require('../models/RewardInventory');
const RewardTransaction = require('../models/RewardTransaction');

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

// GET reward catalog
router.get('/catalog', auth, async (req, res) => {
  try {
    const rewards = await Reward.find();
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user inventory
router.get('/inventory', auth, async (req, res) => {
  try {
    const inventory = await RewardInventory.find({ userId: req.userId }).populate('rewardId');
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed demo rewards if none exist (only once per user)
router.post('/seed-demo', auth, async (req, res) => {
  try {
    const existing = await RewardInventory.findOne({ userId: req.userId });
    if (existing) return res.status(400).json({ msg: 'Demo rewards already seeded' });

    const demoRewards = [
      { name: 'Energy Booster', description: 'Instant +500 Energy', category: 'ENERGY', rarity: 'UNCOMMON', value: 500, icon: '⚡' },
      { name: 'Speed Boost', description: 'Double XP for 1 hour', category: 'POWER_UP', rarity: 'RARE', value: 0, icon: '🚀' },
      { name: 'Warrior Badge', description: 'Earned by completing your first challenge', category: 'BADGE', rarity: 'RARE', value: 0, icon: '🛡️' },
      { name: 'Tide Master Title', description: 'Exclusive title for community leaders', category: 'TITLE', rarity: 'EPIC', value: 0, icon: '👑' },
    ];

    for (const r of demoRewards) {
      let reward = await Reward.findOne({ name: r.name });
      if (!reward) reward = await Reward.create(r);
      await RewardInventory.create({ userId: req.userId, rewardId: reward._id, quantity: 1 });
      await RewardTransaction.create({ userId: req.userId, rewardId: reward._id, source: 'ADMIN', quantity: 1 });
    }

    res.json({ success: true, message: 'Demo rewards seeded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST claim reward (idempotent)
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ msg: 'Reward not found' });

    // Check if already claimed for this user
    const existingClaim = await RewardTransaction.findOne({
      userId: req.userId,
      rewardId: reward._id,
      source: 'CLAIM'
    });
    if (existingClaim) return res.status(400).json({ msg: 'Reward already claimed' });

    // Add to inventory
    await RewardInventory.create({ userId: req.userId, rewardId: reward._id, quantity: 1 });
    await RewardTransaction.create({ userId: req.userId, rewardId: reward._id, source: 'CLAIM', quantity: 1 });

    // If reward is energy, update user energy
    if (reward.category === 'ENERGY') {
      const User = require('../models/User');
      const user = await User.findById(req.userId);
      user.energy += reward.value;
      await user.save();
    }

    res.json({ success: true, reward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;