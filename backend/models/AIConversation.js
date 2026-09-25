const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const AIConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat',
    trim: true,
    maxlength: 60
  },
  accountType: {
    type: String,
    enum: ['BEGINNER', 'PRO'],
    default: 'BEGINNER'
  },
  personality: String,
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for fast conversation listing (newest first, per user)
AIConversationSchema.index({ userId: 1, updatedAt: -1 });

// Auto-update `updatedAt` whenever a message is added or title changes
AIConversationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AIConversation', AIConversationSchema);