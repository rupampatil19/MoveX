/**
 * One-time migration: merge Thane + Navi Mumbai cities into Mumbai.
 *
 * What it does:
 *   1. User docs where cityId ∈ {thane, navi-mumbai} → cityId = 'mumbai'
 *   2. Community docs where city  ∈ {thane, navi-mumbai} → city  = 'mumbai'
 *   3. RegionalContribution docs where city ∈ {thane, navi-mumbai} → city = 'mumbai'
 *
 * What it does NOT do:
 *   - Does NOT change user's `region` field (their region stays the same)
 *   - Does NOT touch energy, xp, streak, trophies
 *   - Does NOT delete any documents
 *   - Does NOT touch other cities
 *
 * Run once:  node scripts/mergeMumbaiCities.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const RegionalContribution = require('../models/RegionalContribution');

const OLD_CITY_IDS = ['thane', 'navi-mumbai'];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // ---- 1. Users ----
    const usersBefore = await User.countDocuments({
      cityId: { $in: OLD_CITY_IDS },
    });
    console.log(`Users to migrate: ${usersBefore}`);

    const usersResult = await User.updateMany(
      { cityId: { $in: OLD_CITY_IDS } },
      { $set: { cityId: 'mumbai' } }
    );
    console.log(`  → Modified: ${usersResult.modifiedCount}\n`);

    // ---- 2. Community docs ----
    const communitiesBefore = await Community.countDocuments({
      city: { $in: OLD_CITY_IDS },
    });
    console.log(`Community docs to migrate: ${communitiesBefore}`);

    const commsResult = await Community.updateMany(
      { city: { $in: OLD_CITY_IDS } },
      { $set: { city: 'mumbai' } }
    );
    console.log(`  → Modified: ${commsResult.modifiedCount}\n`);

    // ---- 3. RegionalContribution docs ----
    const rcBefore = await RegionalContribution.countDocuments({
      city: { $in: OLD_CITY_IDS },
    });
    console.log(`RegionalContribution docs to migrate: ${rcBefore}`);

    const rcResult = await RegionalContribution.updateMany(
      { city: { $in: OLD_CITY_IDS } },
      { $set: { city: 'mumbai' } }
    );
    console.log(`  → Modified: ${rcResult.modifiedCount}\n`);

    // ---- 4. Post-migration verification ----
    console.log('========== Post-migration check ==========');

    const usersRemaining = await User.countDocuments({
      cityId: { $in: OLD_CITY_IDS },
    });
    const communitiesRemaining = await Community.countDocuments({
      city: { $in: OLD_CITY_IDS },
    });
    const rcRemaining = await RegionalContribution.countDocuments({
      city: { $in: OLD_CITY_IDS },
    });

    const usersMumbai = await User.countDocuments({ cityId: 'mumbai' });
    const commsMumbai = await Community.countDocuments({ city: 'mumbai' });

    console.log(`Users still on old cityIds:      ${usersRemaining} (should be 0)`);
    console.log(`Communities still on old cities: ${communitiesRemaining} (should be 0)`);
    console.log(`RC still on old cities:          ${rcRemaining} (should be 0)`);
    console.log('');
    console.log(`Users now on Mumbai:             ${usersMumbai}`);
    console.log(`Community docs now on Mumbai:    ${commsMumbai}`);
    console.log('');

    if (usersRemaining === 0 && communitiesRemaining === 0 && rcRemaining === 0) {
      console.log('✅ Mumbai merge complete.');
    } else {
      console.log('⚠️  Some docs still on old cityIds. Re-run this script.');
    }
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();