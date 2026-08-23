const mongoose = require('mongoose');

const AICoachProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  personality: { type: String, enum: ['Aqua', 'Blaze', 'Nova', 'Sage', 'Echo', 'Vertex'], default: 'Nova' },
  goals: [{
    title: String,
    target: Number,
    metric: String, // e.g., 'distance_km', 'activities', 'streak', 'xp'
    current: Number,
    startDate: Date,
    targetDate: Date,
    completed: { type: Boolean, default: false }
  }],
  preferences: {
    primarySport: { type: String, default: 'running' },
    weeklyTarget: { type: Number, default: 3 },
    availableTime: { type: Number, default: 30 }, // minutes per session
    trainingDays: { type: [Number], default: [1,2,3,4,5] } // 0=Sunday
  },
  notifications: {
    goals: { type: Boolean, default: true },
    streak: { type: Boolean, default: true },
    performance: { type: Boolean, default: true },
    community: { type: Boolean, default: true },
    quietHours: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('AICoachProfile', AICoachProfileSchema);