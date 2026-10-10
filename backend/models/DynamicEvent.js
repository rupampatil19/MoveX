const mongoose = require('mongoose');

const DynamicEventSchema = new mongoose.Schema({
  city:     { type: String, index: true },
  name:     { type: String, required: true },
  date:     { type: String },
  location: { type: String },
  url:      { type: String },
  source:   { type: String, default: 'tinyfish' },
  createdAt:{ type: Date, default: Date.now },
  expiresAt:{ type: Date },
});

DynamicEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('DynamicEvent', DynamicEventSchema);
