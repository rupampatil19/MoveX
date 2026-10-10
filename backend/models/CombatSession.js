/**
 * CombatSession.js
 * Mongoose model for a single combat training session.
 * Created as a dual-write from POST /api/activity when rawData.combat is present.
 */
const mongoose = require('mongoose');

const CombatRoundSchema = new mongoose.Schema({
  round: { type: Number, required: true },
  strikes: { type: Number, default: 0 },
  strikeRate: { type: Number, default: 0 },
  maxImpact: { type: Number, default: 0 },
  intensityAvg: { type: Number, default: 0 },
  hrAvg: { type: Number, default: 0 },
  hrMax: { type: Number, default: 0 },
  hrEnd: { type: Number, default: 0 },
  recoveryDrop: { type: Number, default: null },
}, { _id: false });

const CombatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', index: true },

  discipline: {
    type: String,
    enum: ['boxing', 'mma', 'muaythai', 'kickboxing'],
    required: true,
    index: true,
  },

  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true },
  durationSeconds: { type: Number, default: 0 },

  roundsPlanned: { type: Number, default: 3 },
  rounds: [CombatRoundSchema],

  totals: {
    strikes: { type: Number, default: 0 },
    hardestImpact: { type: Number, default: 0 },
    avgStrikeRate: { type: Number, default: 0 },
    powerScore: { type: Number, default: 0 },
    enduranceScore: { type: Number, default: 0 },
    conditioningIndex: { type: Number, default: 0 },
  },

  strikeTypeDistribution: {
    straight: { type: Number, default: 0 },
    hook: { type: Number, default: 0 },
    uppercut: { type: Number, default: 0 },
    block: { type: Number, default: 0 },
  },

  // Compact summaries for fast queries (full timelines live in Activity.rawData)
  avgHR: { type: Number, default: 0 },
  peakHR: { type: Number, default: 0 },
}, { timestamps: true });

// Compound index for "my combat sessions, newest first"
CombatSessionSchema.index({ userId: 1, startedAt: -1 });

// For leaderboards: top conditioning index this week (filter by discipline + date)
CombatSessionSchema.index({ discipline: 1, 'totals.conditioningIndex': -1, startedAt: -1 });

module.exports = mongoose.model('CombatSession', CombatSessionSchema);