const mongoose = require('mongoose');

const ClanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🏰' },
  region: { type: String, default: 'All' },
  privacy: { type: String, enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC' },
  maxMembers: { type: Number, default: 50 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  energy: { type: Number, default: 0 },
  weeklyEnergy: { type: Number, default: 0 },
  tier: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'LEGEND'], default: 'BRONZE' },
  leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accountType: { type: String, enum: ['BEGINNER', 'PRO'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Clan', ClanSchema);