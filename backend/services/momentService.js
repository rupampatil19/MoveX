const MoveXMoment = require('../models/MoveXMoment');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Community = require('../models/Community');

// Define milestone types and calculation functions
const MILESTONES = [
  {
    type: 'FIRST_ACTIVITY',
    title: 'First Move Complete',
    subtitle: 'Your MoveX journey has begun!',
    check: async (userId) => {
      const count = await Activity.countDocuments({ userId });
      return count >= 1;
    },
    metrics: async (userId) => {
      const user = await User.findById(userId);
      return {
        activities: 1,
        energy: user.energy,
        xp: user.xp,
        trophies: user.trophies.length,
        streak: user.streak,
      };
    },
    regionImpact: (region) => `Your first move helped ${region} start evolving.`,
  },
  {
    type: 'TEN_ACTIVITIES',
    title: '10 Activities Completed',
    subtitle: 'You are building real consistency!',
    check: async (userId) => {
      const count = await Activity.countDocuments({ userId });
      return count >= 10;
    },
    metrics: async (userId) => {
      const user = await User.findById(userId);
      const activities = await Activity.find({ userId }).sort({ date: -1 }).limit(10);
      const totalEnergy = activities.reduce((sum, a) => sum + (a.energyAwarded || 0), 0);
      return {
        activities: 10,
        energy: totalEnergy,
        xp: user.xp,
        trophies: user.trophies.length,
        streak: user.streak,
      };
    },
    regionImpact: (region) => `Your 10 moves are powering ${region}.`,
  },
  {
    type: 'STREAK_7',
    title: '7-Day Streak',
    subtitle: 'A full week of movement!',
    check: async (userId) => {
      const user = await User.findById(userId);
      return user.streak >= 7;
    },
    metrics: async (userId) => {
      const user = await User.findById(userId);
      return {
        activities: null, // not activity-based
        energy: user.energy,
        xp: user.xp,
        trophies: user.trophies.length,
        streak: user.streak,
      };
    },
    regionImpact: (region) => `Your 7-day streak is strengthening ${region}.`,
  },
  // Add more milestones as needed
];

async function checkAndCreateMoments(userId) {
  const user = await User.findById(userId).select('region accountType');
  if (!user) return [];

  const createdMoments = [];
  for (const milestone of MILESTONES) {
    const alreadyCreated = await MoveXMoment.findOne({ userId, type: milestone.type });
    if (alreadyCreated) continue;

    const isAchieved = await milestone.check(userId);
    if (isAchieved) {
      const metrics = await milestone.metrics(userId);
      const regionImpact = milestone.regionImpact(user.region);
      const moment = new MoveXMoment({
        userId,
        type: milestone.type,
        title: milestone.title,
        subtitle: milestone.subtitle,
        metrics,
        regionImpact,
        achievedAt: new Date(),
        acknowledged: false,
      });
      await moment.save();
      createdMoments.push(moment);
    }
  }
  return createdMoments;
}

async function getUnacknowledgedMoments(userId) {
  const moments = await MoveXMoment.find({ userId, acknowledged: false }).sort({ achievedAt: -1 });
  return moments;
}

async function acknowledgeMoment(momentId, userId) {
  await MoveXMoment.findOneAndUpdate(
    { _id: momentId, userId },
    { acknowledged: true }
  );
}

async function getAllMoments(userId) {
  return MoveXMoment.find({ userId }).sort({ achievedAt: -1 });
}

module.exports = {
  checkAndCreateMoments,
  getUnacknowledgedMoments,
  acknowledgeMoment,
  getAllMoments,
};