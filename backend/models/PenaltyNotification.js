const mongoose = require('mongoose');

const PenaltyNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  penaltyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Penalty', default: null },

  type: {
    type: String,
    enum: [
      'NUDGE',
      'LAST_CHANCE',
      'STRIKE_1',
      'STRIKE_2',
      'STRIKE_3',
      'RESTRICTED',
      'WINBACK_WELCOME',
      'GATE_PROGRESS',
      'GATE_UNLOCKED',
      'FREEZE_USED',
      'FREEZE_EARNED',
    ],
    required: true,
  },

  tone: { type: String, enum: ['encouraging', 'info', 'warning'], default: 'encouraging' },

  title: { type: String, required: true },
  message: { type: String, required: true },

  actionLabel: { type: String, default: null },
  actionLink: { type: String, default: null },

  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },

  dismissed: { type: Boolean, default: false },
  dismissedAt: { type: Date, default: null },
  snoozedUntil: { type: Date, default: null },

  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

PenaltyNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
PenaltyNotificationSchema.index({ userId: 1, snoozedUntil: 1 });

module.exports = mongoose.model('PenaltyNotification', PenaltyNotificationSchema);