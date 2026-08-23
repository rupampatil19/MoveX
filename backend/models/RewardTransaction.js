const mongoose = require('mongoose');

const RewardTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward' },
  source: { type: String, enum: ['ACTIVITY', 'QUEST', 'ACHIEVEMENT', 'STREAK', 'EVENT', 'CLAN', 'COMMUNITY', 'PURCHASE', 'ADMIN'], required: true },
  quantity: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RewardTransaction', RewardTransactionSchema);