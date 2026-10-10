const mongoose = require('mongoose');

const PenaltySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  type: {
    type: String,
    enum: ['WARNING', 'STRIKE_1', 'STRIKE_2', 'STRIKE_3', 'RESTRICTED', 'WINBACK'],
    required: true,
  },
  reason: {
    type: String,
    enum: ['INACTIVITY', 'AVS_INVALID', 'CLAN_HOPPING', 'MULTI_ACCOUNT', 'RULE_BREACH', 'WINBACK'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
  },

  effects: {
    energyMultiplier: { type: Number, default: 1.0 },
    shieldRemoved: { type: Boolean, default: false },
    chatLocked: { type: Boolean, default: false },
    activityOnly: { type: Boolean, default: false },
  },

  appliedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },

  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: { type: Date, default: null },

  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

PenaltySchema.index({ userId: 1, appliedAt: -1 });
PenaltySchema.index({ userId: 1, resolved: 1 });
PenaltySchema.index({ expiresAt: 1, resolved: 1 });

module.exports = mongoose.model('Penalty', PenaltySchema);