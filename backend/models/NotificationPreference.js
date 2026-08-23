const mongoose = require('mongoose');

const NotificationPreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  activityReminders: { type: Boolean, default: true },
  streakReminders: { type: Boolean, default: true },
  questNotifications: { type: Boolean, default: true },
  communityNotifications: { type: Boolean, default: true },
  clanNotifications: { type: Boolean, default: true },
  rewardNotifications: { type: Boolean, default: true },
  aiCoachNotifications: { type: Boolean, default: true },
  eventNotifications: { type: Boolean, default: true },
  systemNotifications: { type: Boolean, default: true },
  quietHoursEnabled: { type: Boolean, default: false },
  quietHoursStart: { type: String, default: '22:00' },
  quietHoursEnd: { type: String, default: '07:00' }
});

module.exports = mongoose.model('NotificationPreference', NotificationPreferenceSchema);
