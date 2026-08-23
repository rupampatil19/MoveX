const Quest = require('../models/Quest');
const UserQuest = require('../models/UserQuest');
const User = require('../models/User');

// Predefined quests to seed
async function seedQuestsIfEmpty() {
  const count = await Quest.countDocuments();
  if (count > 0) return; // already seeded

  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);
  const endOfMonth = new Date(now);
  endOfMonth.setDate(now.getDate() + 30);

  const quests = [
    // DAILY
    {
      title: 'Daily Move',
      description: 'Complete 20 minutes of any verified activity.',
      category: 'DAILY',
      metric: 'duration_minutes',
      target: 20,
      rule: { minAVS: 60 },
      reward: { energy: 120, xp: 10 },
      startTime: now,
      endTime: endOfDay
    },
    {
      title: 'Morning Walk',
      description: 'Take a 15-minute walk to start your day.',
      category: 'DAILY',
      metric: 'duration_minutes',
      target: 15,
      rule: { activityType: 'walking', minAVS: 60 },
      reward: { energy: 80, xp: 5 },
      startTime: now,
      endTime: endOfDay
    },
    {
      title: 'Cycling Sprint',
      description: 'Cycle for 10 minutes at moderate speed.',
      category: 'DAILY',
      metric: 'duration_minutes',
      target: 10,
      rule: { activityType: 'cycling', minAVS: 60 },
      reward: { energy: 90, xp: 8 },
      startTime: now,
      endTime: endOfDay
    },
    // WEEKLY
    {
      title: 'Weekly Endurance',
      description: 'Complete 4 verified activities this week.',
      category: 'WEEKLY',
      metric: 'activities',
      target: 4,
      rule: { minAVS: 60 },
      reward: { energy: 500, xp: 50 },
      startTime: now,
      endTime: endOfWeek
    },
    {
      title: 'Distance Champion',
      description: 'Cover 25 km in verified activities this week.',
      category: 'WEEKLY',
      metric: 'distance_km',
      target: 25,
      rule: { minAVS: 60 },
      reward: { energy: 600, xp: 60, item: 'Speed Boost' },
      startTime: now,
      endTime: endOfWeek
    },
    {
      title: 'Consistency Streak',
      description: 'Maintain a 7-day activity streak.',
      category: 'WEEKLY',
      metric: 'activities',
      target: 7,
      rule: { minAVS: 60 },
      reward: { energy: 800, xp: 100, trophy: '7 Day Streak' },
      startTime: now,
      endTime: endOfWeek
    },
    // COMMUNITY
    {
      title: 'Clan Power Surge',
      description: 'Help your community generate 5000 Energy.',
      category: 'COMMUNITY',
      metric: 'energy',
      target: 5000,
      rule: { minAVS: 60 },
      reward: { energy: 300, xp: 30, item: 'Rare Reward Chest' },
      startTime: now,
      endTime: endOfWeek
    },
    {
      title: 'Community Contributor',
      description: 'Contribute 2000 Energy to your Power Station.',
      category: 'COMMUNITY',
      metric: 'energy',
      target: 2000,
      rule: { minAVS: 60 },
      reward: { energy: 200, xp: 20 },
      startTime: now,
      endTime: endOfWeek
    },
    // REGIONAL
    {
      title: 'Maharashtra Evolution',
      description: 'Contribute 1500 verified Energy toward the regional Power Hub.',
      category: 'REGIONAL',
      metric: 'energy',
      target: 1500,
      rule: { minAVS: 80 },
      reward: { energy: 400, xp: 40, trophy: 'Regional Champion' },
      startTime: now,
      endTime: endOfMonth
    },
    {
      title: 'Regional Distance King',
      description: 'Run 30 km in your region this month.',
      category: 'REGIONAL',
      metric: 'distance_km',
      target: 30,
      rule: { activityType: 'running', minAVS: 60 },
      reward: { energy: 500, xp: 50 },
      startTime: now,
      endTime: endOfMonth
    },
    // ATHLETE
    {
      title: 'Pace Master',
      description: 'Complete 3 running sessions with average pace under 6:30 min/km.',
      category: 'ATHLETE',
      metric: 'activities',
      target: 3,
      rule: { activityType: 'running', minAVS: 80 },
      reward: { energy: 300, xp: 35, trophy: 'Pace Master' },
      startTime: now,
      endTime: endOfMonth
    },
    {
      title: 'Heart Rate Discipline',
      description: 'Complete 30 minutes in your target heart rate zone.',
      category: 'ATHLETE',
      metric: 'heart_rate_minutes',
      target: 30,
      rule: { minAVS: 80 },
      reward: { energy: 350, xp: 40 },
      startTime: now,
      endTime: endOfMonth
    },
    // More quests
    {
      title: 'First Step',
      description: 'Complete your first verified activity.',
      category: 'ATHLETE',
      metric: 'activities',
      target: 1,
      rule: { minAVS: 60 },
      reward: { energy: 50, xp: 5, trophy: 'First Activity' },
      startTime: now,
      endTime: endOfMonth
    },
    {
      title: '5 KM Runner',
      description: 'Run a total of 5 km.',
      category: 'ATHLETE',
      metric: 'distance_km',
      target: 5,
      rule: { activityType: 'running', minAVS: 60 },
      reward: { energy: 100, xp: 10, trophy: '5 KM Runner' },
      startTime: now,
      endTime: endOfMonth
    },
    {
      title: '10 KM Runner',
      description: 'Run a total of 10 km.',
      category: 'ATHLETE',
      metric: 'distance_km',
      target: 10,
      rule: { activityType: 'running', minAVS: 60 },
      reward: { energy: 200, xp: 20, trophy: '10 KM Runner' },
      startTime: now,
      endTime: endOfMonth
    },
    {
      title: 'Cycling Century',
      description: 'Cycle a total of 100 km.',
      category: 'ATHLETE',
      metric: 'distance_km',
      target: 100,
      rule: { activityType: 'cycling', minAVS: 60 },
      reward: { energy: 1000, xp: 100, trophy: 'Cycling Century' },
      startTime: now,
      endTime: endOfMonth
    },
  ];

  await Quest.insertMany(quests);
}

async function seedUserQuests(userId) {
  await seedQuestsIfEmpty();
  const activeQuests = await Quest.find({ status: 'ACTIVE', endTime: { $gt: new Date() } });
  for (const quest of activeQuests) {
    const existing = await UserQuest.findOne({ userId, questId: quest._id });
    if (!existing) {
      await UserQuest.create({
        userId,
        questId: quest._id,
        target: quest.target,
        status: 'AVAILABLE'
      });
    }
  }
}

async function processActivity(userId, activity) {
  await seedUserQuests(userId);
  const userQuests = await UserQuest.find({ userId, status: { $in: ['AVAILABLE', 'IN_PROGRESS'] } })
    .populate('questId');

  for (const uq of userQuests) {
    const quest = uq.questId;
    let progress = uq.progress;

    if (quest.metric === 'duration_minutes') {
      if (activity.type === (quest.rule.activityType || activity.type) && activity.duration > 0) {
        if (activity.verification?.status === 'VERIFIED' || activity.verification?.avs >= (quest.rule.minAVS || 60)) {
          progress += activity.duration;
        }
      }
    } else if (quest.metric === 'distance_km') {
      if (activity.type === (quest.rule.activityType || activity.type) && activity.distance > 0) {
        if (activity.verification?.status === 'VERIFIED' || activity.verification?.avs >= (quest.rule.minAVS || 60)) {
          progress += activity.distance;
        }
      }
    } else if (quest.metric === 'activities') {
      if (activity.type === (quest.rule.activityType || activity.type)) {
        if (activity.verification?.status === 'VERIFIED' || activity.verification?.avs >= (quest.rule.minAVS || 60)) {
          progress += 1;
        }
      }
    } else if (quest.metric === 'energy') {
      if (activity.energyAwarded > 0) {
        progress += activity.energyAwarded;
      }
    } else if (quest.metric === 'heart_rate_minutes') {
      if (activity.rawData?.avgHeartRate && (activity.verification?.status === 'VERIFIED')) {
        progress += activity.duration;
      }
    }

    progress = Math.min(progress, quest.target);
    uq.progress = progress;

    if (progress >= quest.target) {
      uq.status = 'COMPLETED';
      uq.completedAt = new Date();
    } else {
      uq.status = 'IN_PROGRESS';
    }
    uq.updatedAt = new Date();
    await uq.save();
  }
}

async function claimReward(userId, userQuestId) {
  const uq = await UserQuest.findOne({ _id: userQuestId, userId });
  if (!uq) throw new Error('Quest not found');
  if (uq.status !== 'COMPLETED') throw new Error('Quest not completed');
  if (uq.status === 'CLAIMED') throw new Error('Already claimed');

  const quest = await Quest.findById(uq.questId);
  const user = await User.findById(userId);

  if (quest.reward.energy) user.energy += quest.reward.energy;
  if (quest.reward.xp) user.xp += quest.reward.xp;
  if (quest.reward.trophy && !user.trophies.includes(quest.reward.trophy)) {
    user.trophies.push(quest.reward.trophy);
  }
  user.level = Math.floor(user.xp / 1000) + 1;
  await user.save();

  uq.status = 'CLAIMED';
  uq.claimedAt = new Date();
  await uq.save();

  return { reward: quest.reward, user };
}

module.exports = { seedQuestsIfEmpty, seedUserQuests, processActivity, claimReward };