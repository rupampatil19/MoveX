const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Helper — the ONE canonical user payload shape every route returns
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  region: u.region,
  accountType: u.accountType,
  level: u.level,
  xp: u.xp,
  energy: u.energy,
  streak: u.streak,
  totalDistance: u.totalDistance,

  // Identity trophies (badge names) — legacy, kept for backwards compat
  trophies: u.trophies || [],

  // ⬇ CANONICAL spendable Trophy currency for the Bazaar
  trophyPoints: u.trophyPoints ?? 0,
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  const { name, email, password, region, accountType } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all required fields' });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      region: region || 'Kothrud',
      accountType: accountType === 'PRO' ? 'PRO' : 'BEGINNER',
      trophies: [],
      trophyPoints: 0,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter email and password' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // One-time safe migration for legacy users: ensure trophyPoints exists
    if (user.trophyPoints === undefined || user.trophyPoints === null) {
      user.trophyPoints = Array.isArray(user.trophies) ? user.trophies.length : 0;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me  → current authenticated user (with trophyPoints)
// ---------------------------------------------------------------------------
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(publicUser(user));
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/user  → alias of /me (some existing frontends call this)
// ---------------------------------------------------------------------------
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(publicUser(user));
  } catch (err) {
    console.error('User error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/auth/profile  → update profile fields
// ---------------------------------------------------------------------------
router.put('/profile', auth, async (req, res) => {
  try {
    const allowed = ['name', 'region', 'accountType'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true })
      .select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(publicUser(user));
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
module.exports = router;
module.exports.auth = auth;
module.exports.publicUser = publicUser;