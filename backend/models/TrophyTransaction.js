const mongoose = require('mongoose');

const TrophyTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  athleteMode: { type: String, enum: ['BEGINNER', 'PRO'], required: true },
  delta: { type: Number, required: true },  // + earn, − spend
  reason: {
    type: String,
    enum: ['VERIFIED_ACTIVITY', 'REWARD_REDEMPTION', 'REFUND', 'ADMIN'],
    required: true,
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  balanceAfter: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

TrophyTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('TrophyTransaction', TrophyTransactionSchema);