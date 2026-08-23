const mongoose = require('mongoose');

const ClanDonationSchema = new mongoose.Schema({
  clanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['ENERGY', 'RESOURCE'], default: 'ENERGY' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClanDonation', ClanDonationSchema);