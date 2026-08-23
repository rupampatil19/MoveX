const mongoose = require('mongoose');

const ClanJoinRequestSchema = new mongoose.Schema({
  clanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClanJoinRequest', ClanJoinRequestSchema);