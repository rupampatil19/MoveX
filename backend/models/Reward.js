const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  slug: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },

  category: {
    type: String,
    enum: [
      // legacy categories (kept for backwards compat)
      'ENERGY', 'RESOURCE', 'POWER_UP', 'SKIN', 'THEME', 'BADGE', 'TITLE',
      // new Bazaar categories
      'COSMETIC', 'BOOST', 'PARTNER', 'CLAN', 'EXPERIENCE',
    ],
    required: true,
  },

  rarity: {
    type: String,
    enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'],
    default: 'COMMON',
  },

  // numeric value used by legacy rewards (e.g. +500 energy)
  value: { type: Number, default: 0 },

  icon: { type: String, default: '' },          // legacy icon (emoji or class)
  iconEmoji: { type: String, default: '' },     // new explicit emoji

  // NEW — Bazaar economy fields
  trophyCost: { type: Number, default: 0, min: 0 },
  athleteMode: { type: String, enum: ['BEGINNER', 'PRO', 'BOTH'], default: 'BOTH' },
  stock: { type: Number, default: null },       // null = unlimited
  availableUntil: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  // metadata examples:
  //   boost : { duration_hours: 24, multiplier: 1.5, target: 'regional_energy' }
  //   cosmetic: { frame_slug: 'poseidon' }

  createdAt: { type: Date, default: Date.now },
});

RewardSchema.index({ category: 1, isActive: 1 });
RewardSchema.index({ athleteMode: 1 });

module.exports = mongoose.model('Reward', RewardSchema);