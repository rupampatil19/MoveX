const mongoose = require('mongoose');

const StrikeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  penaltyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Penalty' },

  strikeNumber: { type: Number, required: true, min: 1, max: 4 },
  reason: {
    type: String,
    enum: ['INACTIVITY', 'AVS_INVALID', 'CLAN_HOPPING', 'MULTI_ACCOUNT', 'RULE_BREACH'],
    required: true,
  },

  appliedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },

  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
  resolvedBy: {
    type: String,
    enum: ['ACTIVITY', 'TIME', 'FORGIVENESS', 'ADMIN'],
    default: null,
  },
}, { timestamps: true });

StrikeSchema.index({ userId: 1, resolved: 1 });
StrikeSchema.index({ expiresAt: 1, resolved: 1 });

module.exports = mongoose.model('Strike', StrikeSchema);