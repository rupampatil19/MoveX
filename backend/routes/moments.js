const express = require('express');
const jwt = require('jsonwebtoken');
const momentService = require('../services/momentService');

const router = express.Router();

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

// GET /api/moments/unacknowledged
router.get('/unacknowledged', auth, async (req, res) => {
  try {
    const moments = await momentService.getUnacknowledgedMoments(req.userId);
    res.json(moments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/moments/:id/acknowledge
router.post('/:id/acknowledge', auth, async (req, res) => {
  try {
    await momentService.acknowledgeMoment(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/moments
router.get('/', auth, async (req, res) => {
  try {
    const moments = await momentService.getAllMoments(req.userId);
    res.json(moments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;