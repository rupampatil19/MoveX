const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  category: { type: String, enum: ['ENERGY', 'RESOURCE', 'POWER_UP', 'SKIN', 'THEME', 'BADGE', 'TITLE'], required: true },
  rarity: { type: String, enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'], default: 'COMMON' },
  value: Number,
  icon: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reward', RewardSchema);