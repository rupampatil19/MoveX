const express = require('express');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const EventParticipant = require('../models/EventParticipant');
const User = require('../models/User');

const router = express.Router();

const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    const user = await User.findById(req.userId).select('accountType region');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

async function seedEventsIfEmpty() {
  const count = await Event.countDocuments();
  if (count > 0) return;
  const now = new Date();
  const end7d = new Date(now.getTime() + 7*24*60*60*1000);
  const end30d = new Date(now.getTime() + 30*24*60*60*1000);
  await Event.insertMany([
    {
      title: 'Beginner: All-India Oceanic Fitness League',
      description: 'National state-versus-state fitness expedition for beginners.',
      type: 'SEASON', season: '3', scope: 'NATIONAL', featured: true,
      startTime: now, endTime: end30d, status: 'LIVE', rewardPool: 50000,
      entryRequirement: 'Open to all beginners', rules: 'Earn points through verified activities',
      metric: 'energy', target: 100000, accountType: 'BEGINNER'
    },
    {
      title: 'Pro: Grand Monsoon Tide War',
      description: 'State-level competition for pro athletes.',
      type: 'REGIONAL', season: '3', scope: 'STATE', featured: true,
      startTime: now, endTime: end7d, status: 'LIVE', rewardPool: 20000,
      entryRequirement: 'At least 1 verified activity', rules: 'Only verified activities count',
      metric: 'energy', target: 50000, accountType: 'PRO'
    },
    {
      title: 'Community Steps Challenge',
      description: 'Walk or run 50 km as a community.',
      type: 'COMMUNITY', scope: 'CITY', featured: false,
      startTime: now, endTime: end7d, status: 'UPCOMING', rewardPool: 5000,
      entryRequirement: 'None', rules: 'Distance from verified walking/running',
      metric: 'distance_km', target: 50, accountType: 'ALL'
    }
  ]);
}

// GET /api/events - list events visible to user's accountType
router.get('/', auth, async (req, res) => {
  try {
    await seedEventsIfEmpty();
    const accountType = req.user.accountType;
    const events = await Event.find({
      $or: [{ accountType: accountType }, { accountType: 'ALL' }]
    }).sort({ featured: -1, startTime: 1 });

    const eventsWithCount = await Promise.all(events.map(async (event) => {
      const participants = await EventParticipant.countDocuments({ eventId: event._id });
      return { ...event.toObject(), participants };
    }));
    res.json(eventsWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Other routes: GET /:id, POST /join must also enforce accountType.
// Implement similarly.

router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    // Ensure event is for user's accountType or ALL
    if (event.accountType !== req.user.accountType && event.accountType !== 'ALL') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const participant = await EventParticipant.findOne({ eventId: event._id, userId: req.userId });
    const participantsCount = await EventParticipant.countDocuments({ eventId: event._id });
    res.json({
      ...event.toObject(),
      participants: participantsCount,
      userParticipant: participant ? { ...participant.toObject() } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (event.accountType !== req.user.accountType && event.accountType !== 'ALL') {
      return res.status(403).json({ msg: 'Cannot join event from another ecosystem' });
    }
    if (event.status === 'COMPLETED') return res.status(400).json({ msg: 'Event already completed' });
    const existing = await EventParticipant.findOne({ eventId: event._id, userId: req.userId });
    if (existing) return res.status(400).json({ msg: 'Already joined' });
    await EventParticipant.create({ eventId: event._id, userId: req.userId });
    res.json({ success: true, msg: 'Joined event' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/leaderboard', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (event.accountType !== req.user.accountType && event.accountType !== 'ALL') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const participants = await EventParticipant.find({ eventId: req.params.id })
      .sort({ score: -1, progress: -1 }).limit(20).populate('userId', 'name');
    const leaderboard = participants.map((p, i) => ({
      rank: i + 1,
      name: p.userId?.name || 'Unknown',
      progress: p.progress,
      score: p.score,
      isCurrentUser: p.userId?._id.toString() === req.userId
    }));
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;