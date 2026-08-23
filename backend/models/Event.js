const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['SEASON', 'REGIONAL', 'COMMUNITY', 'CLAN', 'CHALLENGE'], default: 'CHALLENGE' },
  season: { type: String, default: '1' },
  scope: { type: String, enum: ['CITY', 'STATE', 'NATIONAL', 'GLOBAL'], default: 'STATE' },
  featured: { type: Boolean, default: false },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['UPCOMING', 'LIVE', 'ENDING_SOON', 'COMPLETED'], default: 'UPCOMING' },
  rewardPool: { type: Number, default: 0 },
  entryRequirement: { type: String, default: '' },
  rules: { type: String, default: '' },
  metric: { type: String, enum: ['distance_km', 'duration_minutes', 'energy', 'activities'], default: 'distance_km' },
  target: { type: Number, default: 100 },
  maxParticipants: { type: Number, default: 0 },
  region: { type: String, default: 'All' },
  accountType: { type: String, enum: ['BEGINNER', 'PRO', 'ALL'], default: 'ALL' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);