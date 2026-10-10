const mongoose = require('mongoose');

const WinBackStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

  isDormant: { type: Boolean, default: false },
  dormantSince: { type: Date, default: null },

  winBackClaimed: { type: Boolean, default: false },
  winBackClaimedAt: { type: Date, default: null },

  gateActive: { type: Boolean, default: false },
  gateStartedAt: { type: Date, default: null },
  gateProgress: { type: Number, default: 0, min: 0, max: 7 },
  gateLastActivityDate: { type: Date, default: null },
  gateUnlockedAt: { type: Date, default: null },

  nudgesSent: {
    day30: { type: Date, default: null },
    day40: { type: Date, default: null },
    day55: { type: Date, default: null },
    day75: { type: Date, default: null },
  },

  lastEvaluatedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('WinBackState', WinBackStateSchema);