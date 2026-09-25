const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Community = require('../models/Community');
const {
  CITY_HIERARCHY,
  getRegionsForCity,
  getRegionsForState,
} = require('../data/regionHierarchy');

const router = express.Router();

const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    const user = await User.findById(req.userId).select('accountType region cityId stateId');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

const SELECT_FIELDS = 'name region cityId stateId totalDistance level xp energy trophies streak';

// Build geographic filter from ?scope=&regionId=&cityId=&stateId=
function buildScopeFilter(req) {
  const scope = req.query.scope || 'global';
  const { regionId, cityId, stateId } = req.query;
  const accountType = req.user.accountType;

  if (scope === 'state' && stateId) {
    const regionIds = getRegionsForState(stateId);
    return { accountType, region: { $in: regionIds } };
  }

  if (scope === 'city' && cityId) {
    const regionIds = getRegionsForCity(cityId);
    return { accountType, region: { $in: regionIds } };
  }

  if (scope === 'region' && regionId) {
    return { accountType, region: regionId };
  }

  if (!scope || scope === 'global') {
    return { accountType };
  }

  if (req.user.region) {
    return { accountType, region: req.user.region };
  }

  return { accountType };
}

// ---------------------------------------------------------------------------
// GET /api/leaderboard
// Sorted by LEVEL first, then ENERGY, then XP
// ---------------------------------------------------------------------------
router.get('/', auth, async (req, res) => {
  try {
    const filter = buildScopeFilter(req);
    const users = await User.find(filter)
      .select(SELECT_FIELDS)
      .sort({ level: -1, energy: -1, xp: -1, totalDistance: -1 })
      .limit(100);
    res.json(users);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/leaderboard/regions
// scope=city  & cityId=pune  → all Pune regions, ranked by energy
// scope=state & stateId=MH   → ALL regions of ALL Maharashtra cities, ranked
// scope=global                → all regions nationally
// ---------------------------------------------------------------------------
router.get('/regions', auth, async (req, res) => {
  try {
    const scope = req.query.scope;
    const { cityId, stateId, regionId } = req.query;
    const accountType = req.user.accountType;

    // Validate: if regionId is passed with cityId, ensure region belongs to city
    if (regionId && cityId) {
      const cityRegions = getRegionsForCity(cityId);
      if (!cityRegions.includes(regionId)) {
        return res.status(400).json({
          error: 'Invalid region/city combination',
          detail: `${regionId} does not belong to ${cityId}`,
        });
      }
    }

        // ---------- CITY scope (or REGION scope that carries a cityId): ----------
    // Only regions that belong to the requested city.
    if ((scope === 'city' || scope === 'region') && cityId) {
      const regionIds = getRegionsForCity(cityId);
      const docs = await Community.find({
        accountType,
        region: { $in: regionIds },
      }).select('region totalEnergy powerStationLevel communityLevel');

      const map = new Map(docs.map((d) => [d.region, d]));
      const result = regionIds
        .map((rid) => ({
          region: rid,
          name: rid,
          totalEnergy: map.get(rid)?.totalEnergy || 0,
          powerStationLevel: map.get(rid)?.powerStationLevel || 1,
          communityLevel: map.get(rid)?.communityLevel || 1,
        }))
        .sort((a, b) => b.totalEnergy - a.totalEnergy);

      return res.json(result);
    }

    // ---------- STATE scope: all regions of all cities in the state ----------
    if (scope === 'state' && stateId) {
      // Get all cities that belong to this state
      const cityIds = Object.entries(CITY_HIERARCHY)
        .filter(([, info]) => info.state === stateId)
        .map(([id]) => id);

      // Collect every region from every city
      const allRegionIds = [];
      const regionToCity = {};
      cityIds.forEach((cid) => {
        const regionIds = getRegionsForCity(cid);
        regionIds.forEach((rid) => {
          allRegionIds.push(rid);
          regionToCity[rid] = cid;
        });
      });

      if (allRegionIds.length === 0) return res.json([]);

      const docs = await Community.find({
        accountType,
        region: { $in: allRegionIds },
      }).select('region totalEnergy powerStationLevel communityLevel');

      const map = new Map(docs.map((d) => [d.region, d]));

      const result = allRegionIds
        .map((rid) => ({
          region: rid,
          name: rid,
          city: regionToCity[rid],
          cityName: CITY_HIERARCHY[regionToCity[rid]]?.name || regionToCity[rid],
          totalEnergy: map.get(rid)?.totalEnergy || 0,
          powerStationLevel: map.get(rid)?.powerStationLevel || 1,
          communityLevel: map.get(rid)?.communityLevel || 1,
        }))
        .sort((a, b) => b.totalEnergy - a.totalEnergy);

      return res.json(result);
    }

    // ---------- GLOBAL fallback: all regions ----------
    const docs = await Community.find({ accountType })
      .select('region totalEnergy powerStationLevel communityLevel')
      .sort({ totalEnergy: -1 })
      .limit(100);

    res.json(
      docs.map((d) => ({
        region: d.region,
        totalEnergy: d.totalEnergy || 0,
        powerStationLevel: d.powerStationLevel || 1,
        communityLevel: d.communityLevel || 1,
      }))
    );
  } catch (err) {
    console.error('Regions ranking error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Legacy endpoint — kept for backward compatibility
router.get('/region/:region', auth, async (req, res) => {
  try {
    const region = req.params.region === 'All' ? req.user.region : req.params.region;
    const users = await User.find({ region, accountType: req.user.accountType })
      .select(SELECT_FIELDS)
      .sort({ level: -1, energy: -1, xp: -1, totalDistance: -1 })
      .limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;