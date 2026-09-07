const mongoose = require('mongoose');

const MoveXMomentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // e.g., 'FIRST_ACTIVITY', 'TEN_ACTIVITIES', 'STREAK_7', etc.
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  metrics: { type: Object, default: {} }, // store relevant metrics at time of achievement
  regionImpact: { type: String, default: '' },
  achievedAt: { type: Date, default: Date.now },
  acknowledged: { type: Boolean, default: false } // whether the user has seen the modal
});

module.exports = mongoose.model('MoveXMoment', MoveXMomentSchema);