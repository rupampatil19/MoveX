/**
 * One-time backfill:
 * Adds city/state/country to existing Community + RegionalContribution docs.
 * Run once:  node scripts/backfillGeoHierarchy.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Community = require('../models/Community');
const RegionalContribution = require('../models/RegionalContribution');
const { getHierarchy } = require('../data/regionHierarchy');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // ---- Community ----
    const communities = await Community.find({});
    let commUpdated = 0;
    for (const c of communities) {
      const hier = getHierarchy(c.region);
      if (!c.city || !c.state) {
        c.city = c.city || hier.city;
        c.state = c.state || hier.state;
        c.country = c.country || hier.country;
        await c.save();
        commUpdated++;
      }
    }
    console.log(`Community: backfilled ${commUpdated} / ${communities.length}`);

    // ---- RegionalContribution ----
    const contributions = await RegionalContribution.find({});
    let rcUpdated = 0;
    for (const rc of contributions) {
      const hier = getHierarchy(rc.region);
      if (!rc.city || !rc.state) {
        rc.city = rc.city || hier.city;
        rc.state = rc.state || hier.state;
        rc.country = rc.country || hier.country;
        await rc.save();
        rcUpdated++;
      }
    }
    console.log(`RegionalContribution: backfilled ${rcUpdated} / ${contributions.length}`);

    console.log('\n✅ Backfill complete.');
  } catch (err) {
    console.error('Backfill error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();