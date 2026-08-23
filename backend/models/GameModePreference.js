const mongoose = require('mongoose');

const GameModePreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  mode: { type: String, enum: ['CLASSIC', 'FOCUS'], default: 'CLASSIC' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GameModePreference', GameModePreferenceSchema);