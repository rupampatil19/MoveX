const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Reward = require('../models/Reward');
const RewardInventory = require('../models/RewardInventory');
const RewardRedemption = require('../models/RewardRedemption');
const TrophyTransaction = require('../models/TrophyTransaction');
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

// ---------------------------------------------------------------------------
// GET /api/rewards/balance  → current spendable Trophy balance
// ---------------------------------------------------------------------------
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('trophyPoints trophies accountType');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({
      trophyPoints: user.trophyPoints || 0,
      trophies: user.trophies || [],
      athleteMode: user.accountType,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/rewards/catalog  → rewards visible to the caller's athlete mode
// ---------------------------------------------------------------------------
router.get('/catalog', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('accountType');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const now = new Date();
    const rewards = await Reward.find({
      isActive: true,
      $and: [
        { $or: [{ athleteMode: user.accountType }, { athleteMode: 'BOTH' }] },
        { $or: [{ availableUntil: null }, { availableUntil: { $gt: now } }] },
      ],
    }).sort({ trophyCost: 1 });

    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/rewards/my-rewards  → user inventory (with populated reward)
// ---------------------------------------------------------------------------
router.get('/my-rewards', auth, async (req, res) => {
  try {
    const inventory = await RewardInventory.find({ userId: req.userId })
      .populate('rewardId')
      .sort({ obtainedAt: -1 });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/rewards/history  → redemption log for the current user
// ---------------------------------------------------------------------------
router.get('/history', auth, async (req, res) => {
  try {
    const rows = await RewardRedemption.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/rewards/redeem  → ATOMIC redemption
// Body: { rewardId, idempotencyKey? }
// ---------------------------------------------------------------------------
router.post('/redeem', auth, async (req, res) => {
  const { rewardId, idempotencyKey } = req.body || {};
  if (!rewardId || !mongoose.Types.ObjectId.isValid(rewardId)) {
    return res.status(400).json({ ok: false, error: 'invalid_reward_id' });
  }

  // Idempotency short-circuit — if this key was already used, return the old result
  if (idempotencyKey) {
    const existing = await RewardRedemption.findOne({
      userId: req.userId,
      idempotencyKey,
    });
    if (existing) {
      const u = await User.findById(req.userId).select('trophyPoints');
      return res.json({
        ok: true,
        alreadyProcessed: true,
        reward_name: existing.rewardName,
        reward_category: existing.rewardCategory,
        trophy_cost: existing.trophyCost,
        new_balance: u?.trophyPoints ?? 0,
        redemption_id: existing._id,
      });
    }
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const user = await User.findById(req.userId).session(session);
      if (!user) throw new Error('profile_not_found');

      const reward = await Reward.findById(rewardId).session(session);
      if (!reward || !reward.isActive) throw new Error('reward_unavailable');

      if (reward.athleteMode !== 'BOTH' && reward.athleteMode !== user.accountType) {
        throw new Error('wrong_athlete_mode');
      }

      const now = new Date();
      if (reward.availableUntil && reward.availableUntil < now) throw new Error('expired');

      if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
        throw new Error('out_of_stock');
      }

      const balance = user.trophyPoints || 0;
      if (balance < reward.trophyCost) {
        const e = new Error('insufficient_trophies');
        e.balance = balance;
        e.cost = reward.trophyCost;
        throw e;
      }

      // Atomic guarded decrement — protects against concurrent calls even outside the txn
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.userId, trophyPoints: { $gte: reward.trophyCost } },
        { $inc: { trophyPoints: -reward.trophyCost } },
        { new: true, session }
      );
      if (!updatedUser) throw new Error('insufficient_trophies');

      const newBalance = updatedUser.trophyPoints;

      // Grant inventory entitlement
      const inv = await RewardInventory.create(
        [
          {
            userId: req.userId,
            rewardId: reward._id,
            quantity: 1,
            obtainedAt: new Date(),
          },
        ],
        { session }
      );

      // Audit redemption
      const redemption = await RewardRedemption.create(
        [
          {
            userId: req.userId,
            rewardId: reward._id,
            rewardName: reward.name,
            rewardCategory: reward.category,
            trophyCost: reward.trophyCost,
            athleteMode: user.accountType,
            status: 'COMPLETED',
            idempotencyKey: idempotencyKey || undefined,
          },
        ],
        { session }
      );

      // Ledger entry
      await TrophyTransaction.create(
        [
          {
            userId: req.userId,
            athleteMode: user.accountType,
            delta: -reward.trophyCost,
            reason: 'REWARD_REDEMPTION',
            referenceId: redemption[0]._id,
            balanceAfter: newBalance,
          },
        ],
        { session }
      );

      // Decrement stock if limited
      if (reward.stock !== null && reward.stock !== undefined) {
        await Reward.updateOne({ _id: reward._id }, { $inc: { stock: -1 } }, { session });
      }

      result = {
        ok: true,
        reward_name: reward.name,
        reward_category: reward.category,
        trophy_cost: reward.trophyCost,
        new_balance: newBalance,
        redemption_id: redemption[0]._id,
        inventory_id: inv[0]._id,
        expires_at: reward.metadata?.duration_hours
          ? new Date(Date.now() + reward.metadata.duration_hours * 3600_000).toISOString()
          : null,
      };
    });

    return res.json(result);
  } catch (err) {
    const msg = err.message;
    if (msg === 'insufficient_trophies') {
      return res.status(400).json({
        ok: false,
        error: 'insufficient_trophies',
        balance: err.balance,
        cost: err.cost,
      });
    }
    if (
      ['reward_unavailable', 'wrong_athlete_mode', 'expired', 'out_of_stock', 'profile_not_found'].includes(msg)
    ) {
      return res.status(400).json({ ok: false, error: msg });
    }
    console.error('Redeem error:', err);
    return res.status(500).json({ ok: false, error: 'redemption_failed' });
  } finally {
    session.endSession();
  }
});

// ---------------------------------------------------------------------------
// POST /api/rewards/equip  → equip/unequip a cosmetic
// Body: { inventoryId, equip: boolean }
// ---------------------------------------------------------------------------
router.post('/equip', auth, async (req, res) => {
  const { inventoryId, equip } = req.body || {};
  if (!inventoryId) return res.status(400).json({ msg: 'inventoryId required' });
  try {
    const item = await RewardInventory.findOne({ _id: inventoryId, userId: req.userId });
    if (!item) return res.status(404).json({ msg: 'Not found' });

    if (equip) {
      await RewardInventory.updateMany(
        { userId: req.userId, _id: { $ne: inventoryId } },
        { $set: { equipped: false } }
      );
    }
    item.equipped = !!equip;
    await item.save();
    res.json({ ok: true, equipped: item.equipped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/rewards/activate-boost  → start a boost timer
// Body: { inventoryId }
// ---------------------------------------------------------------------------
router.post('/activate-boost', auth, async (req, res) => {
  const { inventoryId } = req.body || {};
  if (!inventoryId) return res.status(400).json({ msg: 'inventoryId required' });
  try {
    const item = await RewardInventory.findOne({ _id: inventoryId, userId: req.userId }).populate(
      'rewardId'
    );
    if (!item) return res.status(404).json({ msg: 'Not found' });

    const reward = item.rewardId;
    if (!reward || reward.category !== 'BOOST') {
      return res.status(400).json({ msg: 'Not a boost reward' });
    }
    const hours = reward.metadata?.duration_hours;
    if (!hours) return res.status(400).json({ msg: 'Boost has no duration' });

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + hours * 3600_000);

    item.activatedAt = startedAt;
    item.expiresAt = expiresAt;
    await item.save();

    res.json({ ok: true, activatedAt: startedAt, expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// (Legacy endpoints kept for backwards compatibility)
// ---------------------------------------------------------------------------
router.get('/inventory', auth, async (req, res) => {
  try {
    const inv = await RewardInventory.find({ userId: req.userId }).populate('rewardId');
    res.json(inv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/claim', auth, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ msg: 'Reward not found' });
    await RewardInventory.create({ userId: req.userId, rewardId: reward._id, quantity: 1 });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;