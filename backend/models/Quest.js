const mongoose = require('mongoose');

const QuestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['DAILY', 'WEEKLY', 'COMMUNITY', 'REGIONAL', 'ATHLETE'], required: true },
  metric: { type: String, required: true }, // e.g., 'duration_minutes', 'distance_km', 'energy', 'activities', 'heart_rate_minutes'
  target: { type: Number, required: true },
  rule: { type: Object, required: true }, // e.g., { activityType: 'running', minAVS: 60 }
  reward: {
    energy: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    trophy: { type: String, default: null },
    item: { type: String, default: null }
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'DRAFT'], default: 'ACTIVE' }
});

module.exports = mongoose.model('Quest', QuestSchema);