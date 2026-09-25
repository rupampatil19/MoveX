/**
 * One-time backfill: give every existing user a numeric trophyPoints
 * equal to the number of trophy badges they already own.
 * Run once:  node scripts/backfillTrophyPoints.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    let updated = 0;

    for (const u of users) {
      const badgeCount = Array.isArray(u.trophies) ? u.trophies.length : 0;
      const current = u.trophyPoints || 0;
      // Only backfill users who have badges but no numeric points yet
      if (current === 0 && badgeCount > 0) {
        u.trophyPoints = badgeCount;
        await u.save();
        updated++;
        console.log(`  ✓ ${u.email}: trophies=[${badgeCount}] → trophyPoints=${badgeCount}`);
      }
    }

    console.log(`\n✅ Backfilled ${updated} user(s).`);
  } catch (err) {
    console.error('Backfill error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();