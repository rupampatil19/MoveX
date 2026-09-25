const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  region: { type: String, required: true },
  name: { type: String, required: true },
  accountType: { type: String, enum: ['BEGINNER', 'PRO'], required: true },
  totalEnergy: { type: Number, default: 0 },
  powerStationLevel: { type: Number, default: 1 },
  communityLevel: { type: Number, default: 1 },
  powerStationCurrentEnergy: { type: Number, default: 0 },
  powerStationRequiredEnergy: { type: Number, default: 20000 },
  membersCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Compound unique index on region + accountType
CommunitySchema.index({ region: 1, accountType: 1 }, { unique: true });

module.exports = mongoose.model('Community', CommunitySchema);