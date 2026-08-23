const mongoose = require('mongoose');

const ClanEnergyTransactionSchema = new mongoose.Schema({
  clanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  source: { type: String, required: true }, // ACTIVITY, DONATION, EVENT
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClanEnergyTransaction', ClanEnergyTransactionSchema);