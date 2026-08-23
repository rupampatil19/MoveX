const mongoose = require('mongoose');

const EventParticipantSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  rewardsClaimed: { type: Boolean, default: false }
});

EventParticipantSchema.index({ eventId: 1, userId: 1 }, { unique: true });
module.exports = mongoose.model('EventParticipant', EventParticipantSchema);