const mongoose = require('mongoose');

const TrophySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  icon: String,
  requirement: Number, // e.g., totalDistance >= 10, streak >= 7
  metric: String // e.g., 'distance', 'streak', 'activities'
});

module.exports = mongoose.model('Trophy', TrophySchema);