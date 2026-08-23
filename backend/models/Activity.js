const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String },
  type: { type: String, enum: ['running', 'walking', 'cycling', 'workout'], required: true },
  distance: { type: Number, required: true },
  duration: { type: Number, required: true }, // active duration in minutes
  activeDuration: { type: Number }, // minutes
  pausedDuration: { type: Number, default: 0 },
  startTime: { type: Date },
  endTime: { type: Date },
  date: { type: Date, default: Date.now },
  region: { type: String, required: true },
  rawData: {
    avgSpeed: Number,
    avgHeartRate: Number,
    cadence: Number,
    gpsPoints: Number,
    sensorQuality: Number,
    dataQualityScore: Number,
    pace: Number,
    calories: Number,
    elevation: Number
  },
  verification: {
    avs: { type: Number, default: 0 },
    status: { type: String, enum: ['PENDING', 'VERIFIED', 'PROBABLE', 'INVALID'], default: 'PENDING' },
    confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    steps: [{
      step: Number,
      name: String,
      status: { type: String, enum: ['GREEN', 'ORANGE', 'RED'] },
      detail: String,
      score: Number
    }]
  },
  tps: { type: Number, default: 0 },
  scoreBreakdown: {
    effort: { type: Number, default: 0 },
    performance: { type: Number, default: 0 },
    consistency: { type: Number, default: 0 },
    health: { type: Number, default: 0 },
    fairness: { type: Number, default: 0 }
  },
  baseEnergy: { type: Number, default: 0 },
  energyMultiplier: { type: Number, default: 1 },
  baseTrophy: { type: Number, default: 0 },
  trophyMultiplier: { type: Number, default: 1 },
  energyAwarded: { type: Number, default: 0 },
  xpAwarded: { type: Number, default: 0 },
  trophyAwarded: { type: String, default: null },
  communityContribution: { type: Number, default: 0 },
  clanContribution: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', ActivitySchema);