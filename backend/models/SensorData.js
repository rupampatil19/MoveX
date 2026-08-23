const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ActivitySession', required: true },
  timestamp: { type: Date, default: Date.now },
  latitude: Number,
  longitude: Number,
  speed: Number,
  distance: Number,
  acceleration: { x: Number, y: Number, z: Number },
  gyroscope: { x: Number, y: Number, z: Number },
  cadence: Number,
  heartRate: Number,
  elevation: Number,
  battery: Number
});

module.exports = mongoose.model('SensorData', SensorDataSchema);