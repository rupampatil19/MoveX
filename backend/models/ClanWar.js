const mongoose = require('mongoose');

const ClanWarSchema = new mongoose.Schema({
  clanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
  opponentClanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan' },
  status: { type: String, enum: ['PREPARATION', 'ACTIVE', 'ENDED'], default: 'PREPARATION' },
  startDate: { type: Date },
  endDate: { type: Date },
  score: { type: Number, default: 0 },
  opponentScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClanWar', ClanWarSchema);