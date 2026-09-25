const mongoose = require('mongoose');

const RegionalContributionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  region: { type: String, required: true },
  accountType: { type: String, enum: ['BEGINNER', 'PRO'], required: true },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  amount: { type: Number, required: true },
  source: { type: String, default: 'ACTIVITY' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RegionalContribution', RegionalContributionSchema);