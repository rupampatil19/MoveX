require('dotenv').config();
const mongoose = require('mongoose');
const Community = require('../models/Community');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Find docs with missing / invalid accountType
  const broken = await Community.find({
    $or: [
      { accountType: { $exists: false } },
      { accountType: null },
      { accountType: '' },
    ],
  });

  console.log('Broken docs count:', broken.length);
  console.log(JSON.stringify(broken, null, 2));

  // Also show all docs to see the full picture
  console.log('\n--- ALL COMMUNITY DOCS ---');
  const all = await Community.find({}).select(
    'region city state country accountType totalEnergy powerStationLevel -_id'
  );
  console.table(all.map((d) => d.toObject()));

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});