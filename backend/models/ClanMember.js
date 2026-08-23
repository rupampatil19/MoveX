const mongoose = require('mongoose');

const ClanMemberSchema = new mongoose.Schema({
  clanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['LEADER', 'CO_LEADER', 'ELDER', 'MEMBER', 'NEW_MEMBER'], default: 'MEMBER' },
  joinedAt: { type: Date, default: Date.now },
  weeklyEnergy: { type: Number, default: 0 },
  totalEnergy: { type: Number, default: 0 },
  totalXP: { type: Number, default: 0 }
});

ClanMemberSchema.index({ clanId: 1, userId: 1 }, { unique: true });
module.exports = mongoose.model('ClanMember', ClanMemberSchema);