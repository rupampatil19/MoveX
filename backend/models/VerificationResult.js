const mongoose = require('mongoose');

const VerificationResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ActivitySession' },
  activityType: String,
  steps: [{
    step: Number,
    name: String,
    status: { type: String, enum: ['GREEN', 'ORANGE', 'RED'] },
    detail: String,
    score: Number
  }],
  motionPatternScore: Number,
  gpsConsistencyScore: Number,
  durationScore: Number,
  physiologicalScore: Number,
  dataQualityScore: Number,
  avs: Number,
  confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
  decision: { type: String, enum: ['VERIFIED', 'PROBABLE', 'INVALID'] },
  energyEligible: Boolean,
  energyMultiplier: Number,
  anomalies: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VerificationResult', VerificationResultSchema);