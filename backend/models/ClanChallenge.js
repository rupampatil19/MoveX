const mongoose = require('mongoose');

const ClanChallengeSchema = new mongoose.Schema({
  clanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  goal: { type: Number, required: true }, // e.g., total km or energy
  metric: { type: String, default: 'distance' }, // distance, energy, activities
  current: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  reward: { type: String, default: '' },
  completed: { type: Boolean, default: false }
});

module.exports = mongoose.model('ClanChallenge', ClanChallengeSchema);