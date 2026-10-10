const express = require('express');
const router = express.Router();
const { startEventResearch } = require('../services/tinyfishService');
const DynamicEvent = require('../models/DynamicEvent');

// POST /api/dynamic-quests/generate  { city: 'Pune' }
router.post('/generate', async (req, res) => {
  const city = req.body && req.body.city;
  if (!city) return res.status(400).json({ msg: 'City required' });
  try {
    const result = await startEventResearch(city, null);
    const events = (result && result.events) ? result.events : [];

    let stored = 0;
    for (const ev of events) {
      await DynamicEvent.create({
        city: city,
        name: ev.name,
        date: ev.date || null,
        location: ev.location || city,
        url: ev.url,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      stored++;
    }
    res.json({ status: 'ok', city: city, found: events.length, stored: stored, events: events });
  } catch (err) {
    console.error('[dynamic-quests]', err.message);
    res.status(500).json({ msg: 'Research failed', error: err.message });
  }
});

// POST /api/dynamic-quests/webhook - retained for future use
router.post('/webhook', async (req, res) => {
  res.json({ ok: true, msg: 'Webhook flow not used; events stored synchronously' });
});

// GET /api/dynamic-quests/events?city=Pune
router.get('/events', async (req, res) => {
  const city = req.query.city;
  const filter = {};
  if (city) filter.city = city;
  try {
    const events = await DynamicEvent.find(filter).sort({ date: 1 }).limit(50);
    res.json({ count: events.length, events: events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;