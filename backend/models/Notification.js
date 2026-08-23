const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['ALERT', 'REMINDER', 'OPPORTUNITY', 'MOTIVATIONAL', 'SOCIAL', 'SYSTEM'], default: 'SYSTEM' },
  title: String,
  message: String,
  icon: String,
  read: { type: Boolean, default: false },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  actionRoute: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

module.exports = mongoose.model('Notification', NotificationSchema);