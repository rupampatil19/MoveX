const mongoose = require('mongoose');

const StreakFreezeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

  available: { type: Number, default: 0, min: 0, max: 3 },
  totalEarned: { type: Number, default: 0 },

  earnedHistory: [{
    source: { type: String, enum: ['WEEKLY_STREAK', 'MILESTONE_30', 'MONTHLY_QUEST', 'CLAN_EVENT', 'WINBACK'] },
    earnedAt: { type: Date, default: Date.now },
  }],

  usedHistory: [{
    usedAt: { type: Date, default: Date.now },
    forDate: { type: Date },
    streakPreserved: { type: Number },
  }],

  lastEarnedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('StreakFreeze', StreakFreezeSchema);