require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = `test-bengaluru-${Date.now()}@movex.test`;
  const user = await User.create({
    name: 'Bengaluru Tester',
    email,
    password: 'not-a-real-password-hash',
    region: 'Koramangala',
    accountType: 'BEGINNER',
  });

  console.log('Created test user:');
  console.log('  email:', email);
  console.log('  region:', user.region);
  console.log('  _id:', user._id.toString());

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});