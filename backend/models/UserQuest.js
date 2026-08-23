const mongoose = require('mongoose');

const UserQuestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quest', required: true },
  progress: { type: Number, default: 0 },
  target: { type: Number, required: true },
  status: { type: String, enum: ['AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'CLAIMED', 'EXPIRED'], default: 'AVAILABLE' },
  completedAt: { type: Date },
  claimedAt: { type: Date },
  updatedAt: { type: Date, default: Date.now }
});

UserQuestSchema.index({ userId: 1, questId: 1 }, { unique: true });
module.exports = mongoose.model('UserQuest', UserQuestSchema);