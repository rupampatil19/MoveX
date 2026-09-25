require('dotenv').config();
const mongoose = require('mongoose');
const Community = require('../models/Community');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Find docs with no valid accountType
  const broken = await Community.find({
    $or: [
      { accountType: { $exists: false } },
      { accountType: null },
      { accountType: '' },
    ],
  });

  console.log('Found broken docs:', broken.length);
  broken.forEach((d) => {
    console.log(`  - ${d.region} (${d.totalEnergy} energy) → deleting`);
  });

  const result = await Community.deleteMany({
    $or: [
      { accountType: { $exists: false } },
      { accountType: null },
      { accountType: '' },
    ],
  });

  console.log('Deleted:', result.deletedCount);

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});