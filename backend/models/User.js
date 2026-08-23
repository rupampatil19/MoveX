const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  region: {
    type: String,
    enum: ['Kothrud', 'Hinjewadi', 'Baner', 'Viman Nagar', 'Hadapsar', 'Shivaji Nagar', 'Pimpri'],
    default: 'Kothrud'
  },
  accountType: { type: String, enum: ['BEGINNER', 'PRO'], default: 'BEGINNER' },
  totalDistance: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  energy: { type: Number, default: 0 },
  trophies: { type: [String], default: [] },
  streak: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: null },
  dailyQuestProgress: { type: Number, default: 0 },
  dailyQuestCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);