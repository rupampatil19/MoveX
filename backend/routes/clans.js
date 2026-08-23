const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Clan = require('../models/Clan');
const ClanMember = require('../models/ClanMember');

const router = express.Router();

// Authentication middleware that loads user's accountType and region
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

// Seed initial public clans if none exist
async function seedPublicClansIfEmpty() {
  const count = await Clan.countDocuments();
  if (count > 0) return;

  const beginnerClans = [
    { name: 'Pune Fitness Warriors', description: 'Train. Move. Grow together.', icon: '🛡️', region: 'Kothrud', privacy: 'PUBLIC', maxMembers: 50, accountType: 'BEGINNER' },
    { name: 'Pune Morning Movers', description: 'Start your day with movement.', icon: '🌅', region: 'Baner', privacy: 'PUBLIC', maxMembers: 50, accountType: 'BEGINNER' },
    { name: 'Weekend Walkers Pune', description: 'Walk together every weekend.', icon: '🚶', region: 'Hadapsar', privacy: 'PUBLIC', maxMembers: 50, accountType: 'BEGINNER' },
    { name: 'Kothrud Active Squad', description: 'Community fitness for everyone.', icon: '🏃', region: 'Kothrud', privacy: 'PUBLIC', maxMembers: 50, accountType: 'BEGINNER' },
    { name: 'Shivaji Nagar Movers', description: 'Stay active with us.', icon: '💪', region: 'Shivaji Nagar', privacy: 'PUBLIC', maxMembers: 50, accountType: 'BEGINNER' },
  ];

  const proClans = [
    { name: 'Pune Elite Runners', description: 'Advanced running performance group.', icon: '🏆', region: 'Kothrud', privacy: 'PUBLIC', maxMembers: 50, accountType: 'PRO' },
    { name: 'Pune Performance Squad', description: 'Train like a pro.', icon: '⚡', region: 'Shivaji Nagar', privacy: 'PUBLIC', maxMembers: 50, accountType: 'PRO' },
    { name: 'Pune Cycling Elite', description: 'Serious cyclists only.', icon: '🚴', region: 'Viman Nagar', privacy: 'PUBLIC', maxMembers: 50, accountType: 'PRO' },
    { name: 'Pune Endurance League', description: 'Build elite endurance.', icon: '⏱️', region: 'Pimpri', privacy: 'PUBLIC', maxMembers: 50, accountType: 'PRO' },
    { name: 'Baner Pro Athletes', description: 'High-performance community.', icon: '🏅', region: 'Baner', privacy: 'PUBLIC', maxMembers: 50, accountType: 'PRO' },
  ];

  await Clan.insertMany([...beginnerClans, ...proClans]);
}

// GET /api/clans - list public clans of same accountType
router.get('/', auth, async (req, res) => {
  try {
    await seedPublicClansIfEmpty();
    const clans = await Clan.find({ privacy: 'PUBLIC', accountType: req.user.accountType })
      .select('name icon description region level xp energy maxMembers privacy accountType');
    res.json(clans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clans/my - current user's clan
router.get('/my', auth, async (req, res) => {
  try {
    const membership = await ClanMember.findOne({ userId: req.userId }).populate('clanId');
    if (!membership) {
      return res.status(200).json({ clan: null, memberRole: null, members: [] });
    }
    const clan = membership.clanId;
    if (!clan || clan.accountType !== req.user.accountType) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const members = await ClanMember.find({ clanId: clan._id }).populate('userId', 'name level xp energy streak');
    res.json({ clan, memberRole: membership.role, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clans - create clan
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, icon, region, privacy, maxMembers } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ msg: 'Clan name is required' });

    const existingMembership = await ClanMember.findOne({ userId: req.userId });
    if (existingMembership) return res.status(400).json({ msg: 'You are already in a clan' });

    const clan = new Clan({
      name,
      description: description || '',
      icon: icon || '🏰',
      region: region || req.user.region || 'All',
      privacy: privacy || 'PUBLIC',
      maxMembers: maxMembers || 50,
      leaderId: req.userId,
      accountType: req.user.accountType,
    });
    await clan.save();

    await ClanMember.create({ clanId: clan._id, userId: req.userId, role: 'LEADER' });

    res.status(201).json({ clan, memberRole: 'LEADER' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ msg: 'Clan name already exists' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clans/join/:clanId - join a public clan
router.post('/join/:clanId', auth, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.clanId);
    if (!clan) return res.status(404).json({ msg: 'Clan not found' });
    if (clan.accountType !== req.user.accountType) {
      return res.status(403).json({ msg: 'Your athlete mode does not match this Clan.' });
    }
    if (clan.privacy !== 'PUBLIC') return res.status(400).json({ msg: 'This clan is private' });

    const existingMembership = await ClanMember.findOne({ userId: req.userId });
    if (existingMembership) return res.status(400).json({ msg: 'You are already in a clan' });

    const memberCount = await ClanMember.countDocuments({ clanId: clan._id });
    if (memberCount >= clan.maxMembers) return res.status(400).json({ msg: 'Clan is full' });

    await ClanMember.create({ clanId: clan._id, userId: req.userId, role: 'NEW_MEMBER' });

    res.json({ success: true, msg: 'Joined clan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clans/leave - leave current clan
router.post('/leave', auth, async (req, res) => {
  try {
    const membership = await ClanMember.findOne({ userId: req.userId });
    if (!membership) return res.status(400).json({ msg: 'You are not in a clan' });

    const clan = await Clan.findById(membership.clanId);
    if (!clan || clan.accountType !== req.user.accountType) return res.status(403).json({ msg: 'Access denied' });

    if (membership.role === 'LEADER') {
      const memberCount = await ClanMember.countDocuments({ clanId: membership.clanId });
      if (memberCount <= 1) {
        await Clan.findByIdAndDelete(membership.clanId);
        await ClanMember.deleteMany({ clanId: membership.clanId });
        return res.json({ msg: 'Clan disbanded' });
      } else {
        return res.status(400).json({ msg: 'You are the leader. Transfer leadership first.' });
      }
    }

    await ClanMember.deleteOne({ _id: membership._id });
    res.json({ msg: 'Left clan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;