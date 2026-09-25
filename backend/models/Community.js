const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  region: { type: String, required: true },
  name: { type: String, required: true },
  accountType: { type: String, enum: ['BEGINNER', 'PRO'], required: true },

  // ⬇ NEW — Geographic hierarchy (Phase 2)
  city:    { type: String, default: null, index: true },
  state:   { type: String, default: null, index: true },
  country: { type: String, default: 'IN' },

  totalEnergy: { type: Number, default: 0 },
  powerStationLevel: { type: Number, default: 1 },
  communityLevel: { type: Number, default: 1 },
  powerStationCurrentEnergy: { type: Number, default: 0 },
  powerStationRequiredEnergy: { type: Number, default: 20000 },
  membersCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Existing index — kept for backwards compat
CommunitySchema.index({ region: 1, accountType: 1 }, { unique: true });

// NEW — for future multi-city queries
CommunitySchema.index({ country: 1, state: 1, city: 1, accountType: 1 });

module.exports = mongoose.model('Community', CommunitySchema);