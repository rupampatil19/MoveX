const mongoose = require('mongoose');

const RegionalContributionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  region: { type: String, required: true },
  accountType: { type: String, enum: ['BEGINNER', 'PRO'], required: true },

  // ⬇ NEW — Geographic hierarchy (Phase 2)
  city:    { type: String, default: null, index: true },
  state:   { type: String, default: null, index: true },
  country: { type: String, default: 'IN' },

  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  amount: { type: Number, required: true },
  source: { type: String, default: 'ACTIVITY' },
  createdAt: { type: Date, default: Date.now }
});

// NEW — for future city/state aggregation queries
RegionalContributionSchema.index({ country: 1, state: 1, city: 1, accountType: 1, createdAt: -1 });

module.exports = mongoose.model('RegionalContribution', RegionalContributionSchema);