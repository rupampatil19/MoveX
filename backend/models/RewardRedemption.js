const mongoose = require('mongoose');

const RewardRedemptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  rewardName: { type: String, required: true },
  rewardCategory: { type: String, required: true },
  trophyCost: { type: Number, required: true },
  athleteMode: { type: String, enum: ['BEGINNER', 'PRO'], required: true },
  status: {
    type: String,
    enum: ['COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'COMPLETED',
  },
  // idempotency key so a double-click cannot create two rows
  idempotencyKey: { type: String, index: true, sparse: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

RewardRedemptionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('RewardRedemption', RewardRedemptionSchema);