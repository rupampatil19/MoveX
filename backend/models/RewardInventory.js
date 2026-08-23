const mongoose = require('mongoose');

const RewardInventorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  quantity: { type: Number, default: 1 },
  obtainedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RewardInventory', RewardInventorySchema);