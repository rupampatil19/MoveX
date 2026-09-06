const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const conn = mongoose.connection;
    // Drop old unique index on region only
    try {
      await conn.collection('communities').dropIndex('region_1');
      console.log('Dropped old index region_1');
    } catch (err) {
      console.log('Index region_1 may not exist:', err.message);
    }

    // Create new compound unique index
    await conn.collection('communities').createIndex(
      { region: 1, accountType: 1 },
      { unique: true }
    );
    console.log('Created compound unique index on region + accountType');

    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });