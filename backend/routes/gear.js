const express = require('express');
const router = express.Router();
const { searchGearPrices } = require('../services/tinyfishService');

router.get('/search', async (req, res) => {
  const q = req.query.q;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
  if (!q) return res.status(400).json({ msg: 'Query required' });
  try {
    const results = await searchGearPrices(q, maxPrice);
    res.json({ query: q, count: results.length, results: results });
  } catch (err) {
    console.error('[gear route]', err.message);
    res.status(500).json({ msg: 'Search failed', error: err.message });
  }
});

module.exports = router;
