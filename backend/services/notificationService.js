const Notification = require('../models/Notification');

async function createNotification(userId, type, title, message, actionRoute = null) {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      actionRoute,
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Notification creation error:', err);
    return null;
  }
}

module.exports = { createNotification };