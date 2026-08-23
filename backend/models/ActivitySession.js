const mongoose = require('mongoose');

const ActivitySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityType: { type: String, enum: ['running', 'walking', 'cycling', 'workout'], required: true },
  deviceId: { type: String, default: 'demo-device' },
  verificationMode: { type: String, enum: ['SMARTPHONE', 'FITNESS_BAND'], default: 'SMARTPHONE' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ['STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'], default: 'STARTED' },
  calibration: {
    baselineGravity: Number,
    orientation: String,
    sensorNoise: Number,
    quality: { type: String, enum: ['GOOD', 'WARNING', 'POOR'] }
  },
  sensorQuality: {
    battery: Number,
    connection: String,
    packetLoss: Number,
    sensorRange: String,
    timestamps: String
  }
});

module.exports = mongoose.model('ActivitySession', ActivitySessionSchema);