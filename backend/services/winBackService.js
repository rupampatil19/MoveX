/**
 * MoveX Win-Back Service
 *
 * Handles users who have been inactive 30+ days:
 *   · Marks them "dormant" (no ban, no deletion)
 *   · Queues nudges at 30 / 40 / 55 / 75 days
 *   · On return, delivers Welcome Kit
 *   · Applies a 7-day Rewards Gate (only Bazaar locked)
 *   · Unlocks Bazaar after 7 consecutive active days
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const WinBackState = require('../models/WinBackState');
const StreakFreeze = require('../models/StreakFreeze');
const PenaltyNotification = require('../models/PenaltyNotification');
const Penalty = require('../models/Penalty');

const DORMANT_THRESHOLD_DAYS = 30;
const GATE_TARGET_DAYS = 7;

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
function daysBetween(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d) {
  return new Date(d).toISOString().split('T')[0];
}

// ------------------------------------------------------------
// 1. Check dormancy for one user (called by cron)
// ------------------------------------------------------------
async function checkDormancy(userId) {
  const state = await WinBackState.findOne({ userId });
  if (state?.isDormant) {
    // Already dormant — check if it's time for a nudge
    return await processDormantNudges(userId, state);
  }

  const latest = await Activity.findOne({ userId }).sort({ date: -1 }).select('date').lean();
  const daysInactive = latest?.date
    ? daysBetween(new Date(latest.date), new Date())
    : 999;

  if (daysInactive < DORMANT_THRESHOLD_DAYS) {
    return { user: userId, action: 'active', daysInactive };
  }

  // Mark dormant
  const wb = await WinBackState.findOneAndUpdate(
    { userId },
    {
      $set: {
        isDormant: true,
        dormantSince: new Date(),
        lastEvaluatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // Queue Day 30 email nudge
  await PenaltyNotification.create({
    userId,
    type: 'WINBACK_WELCOME',
    tone: 'encouraging',
    title: 'We kept everything safe for you 🌟',
    message: `It's been ${daysInactive} days. Your clan, trophies and level are all here. Come back anytime — we'll have a Welcome Kit ready.`,
    actionLabel: 'Open MoveX',
    actionLink: '/',
  });

  return { user: userId, action: 'marked_dormant', daysInactive };
}

// ------------------------------------------------------------
// 2. Additional nudges at day 40 / 55 / 75
// ------------------------------------------------------------
async function processDormantNudges(userId, state) {
  if (!state.dormantSince) return { user: userId, action: 'no_dormant_since' };

  const daysDormant = daysBetween(new Date(state.dormantSince), new Date());
  const nudges = state.nudgesSent || {};

  const updates = {};

  if (daysDormant >= 40 && !nudges.day40) {
    await PenaltyNotification.create({
      userId,
      type: 'WINBACK_WELCOME',
      tone: 'info',
      title: 'Your clan is waiting 👥',
      message: 'MoveX saved your spot. Your clan hasn\'t forgotten you. Come back whenever you\'re ready.',
      actionLabel: 'See my clan',
      actionLink: '/clan',
    });
    updates['nudgesSent.day40'] = new Date();
  }

  if (daysDormant >= 55 && !nudges.day55) {
    await PenaltyNotification.create({
      userId,
      type: 'WINBACK_WELCOME',
      tone: 'info',
      title: 'Your progress is safe 🛡️',
      message: 'Nothing has been deleted. Level, trophies, streak shield — all preserved. Restart any time.',
      actionLabel: 'Check my profile',
      actionLink: '/profile',
    });
    updates['nudgesSent.day55'] = new Date();
  }

  if (daysDormant >= 75 && !nudges.day75) {
    // Silent archive — no notification, just flag
    updates['nudgesSent.day75'] = new Date();
  }

  if (Object.keys(updates).length > 0) {
    updates.lastEvaluatedAt = new Date();
    await WinBackState.updateOne({ userId }, { $set: updates });
  }

  return { user: userId, action: 'nudged', daysDormant };
}

// ------------------------------------------------------------
// 3. Called when user logs in — check if they're returning
// ------------------------------------------------------------
async function detectReturn(userId) {
  const state = await WinBackState.findOne({ userId });
  if (!state?.isDormant) return { returning: false };

  // User was dormant — deliver Welcome Kit notification (not claimed yet)
  const alreadyNotified = await PenaltyNotification.findOne({
    userId,
    type: 'WINBACK_WELCOME',
    createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  });

  if (!alreadyNotified) {
    await PenaltyNotification.create({
      userId,
      type: 'WINBACK_WELCOME',
      tone: 'encouraging',
      title: 'Welcome back! 🌟',
      message: 'Everything is exactly where you left it. Claim your Welcome Kit and pick up where you left off.',
      actionLabel: 'Claim Welcome Kit',
      actionLink: '/penalties',
    });
  }

  return {
    returning: true,
    dormantSince: state.dormantSince,
    winBackClaimed: state.winBackClaimed,
  };
}

// ------------------------------------------------------------
// 4. Claim the Welcome Kit
// ------------------------------------------------------------
async function claimWelcomeKit(userId) {
  const state = await WinBackState.findOne({ userId });
  if (!state?.isDormant) {
    return { ok: false, error: 'not_dormant' };
  }
  if (state.winBackClaimed) {
    return { ok: false, error: 'already_claimed' };
  }

  const user = await User.findById(userId);
  if (!user) return { ok: false, error: 'user_not_found' };

  // Apply rewards
  const gift = { energy: 100, trophies: 50, freezes: 1, xpBoost: 3 };

  user.energy = (user.energy || 0) + gift.energy;
  user.trophyPoints = (user.trophyPoints || 0) + gift.trophies;
  // XP boost: flag on user (used by verification engine for next N activities)
  user.xpBoostRemaining = (user.xpBoostRemaining || 0) + gift.xpBoost;
  await user.save();

  // Add freeze
  await StreakFreeze.findOneAndUpdate(
    { userId },
    {
      $inc: { available: gift.freezes, totalEarned: gift.freezes },
      $push: { earnedHistory: { source: 'WINBACK', earnedAt: new Date() } },
      $set: { lastEarnedAt: new Date() },
    },
    { upsert: true }
  );

  // Update state — mark claimed, start gate
  state.winBackClaimed = true;
  state.winBackClaimedAt = new Date();
  state.gateActive = true;
  state.gateStartedAt = new Date();
  state.gateProgress = 0;
  state.gateLastActivityDate = null;
  await state.save();

  // Notification confirming
  await PenaltyNotification.create({
    userId,
    type: 'GATE_PROGRESS',
    tone: 'encouraging',
    title: 'Welcome Kit claimed! 🎁',
    message: `+100 Energy, +50 Trophies, +1 Streak Freeze, and 2× XP on your next ${gift.xpBoost} activities. Now complete 7 consecutive active days to reopen MoveX Bazaar.`,
    actionLabel: 'Start day 1',
    actionLink: '/start',
    meta: { gift },
  });

  return { ok: true, gift };
}

// ------------------------------------------------------------
// 5. Track gate progress (called after every activity submission)
// ------------------------------------------------------------
async function updateGateProgress(userId) {
  const state = await WinBackState.findOne({ userId });
  if (!state?.gateActive) return { active: false };

  const today = startOfDay();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // Did user already log an activity today?
  const activityToday = await Activity.findOne({
    userId,
    date: { $gte: today },
  }).select('_id').lean();

  if (!activityToday) {
    return { active: true, progress: state.gateProgress };
  }

  // Was the last activity yesterday? If yes → continue count. If no → reset.
  const lastDate = state.gateLastActivityDate ? new Date(state.gateLastActivityDate) : null;
  const lastDay = lastDate ? startOfDay(lastDate) : null;

  let newProgress;

  if (!lastDay || dayKey(lastDay) === dayKey(today)) {
    // Same day — no change (already counted)
    return { active: true, progress: state.gateProgress };
  }

  if (dayKey(lastDay) === dayKey(yesterday)) {
    // Consecutive — increment
    newProgress = Math.min(state.gateProgress + 1, GATE_TARGET_DAYS);
  } else {
    // Gap — reset to 1 (today)
    newProgress = 1;
  }

  state.gateProgress = newProgress;
  state.gateLastActivityDate = today;

  let unlocked = false;
  if (newProgress >= GATE_TARGET_DAYS) {
    state.gateActive = false;
    state.gateUnlockedAt = new Date();
    unlocked = true;
  }
  await state.save();

  if (unlocked) {
    await PenaltyNotification.create({
      userId,
      type: 'GATE_UNLOCKED',
      tone: 'encouraging',
      title: 'MoveX Bazaar is open 🎉',
      message: '7 consecutive active days! The Bazaar is fully unlocked. Redeem your trophies any time.',
      actionLabel: 'Open Bazaar',
      actionLink: '/rewards',
    });
  } else {
    // Progress notification (once per day max)
    const todayProgressNotif = await PenaltyNotification.findOne({
      userId,
      type: 'GATE_PROGRESS',
      createdAt: { $gte: today },
    });

    if (!todayProgressNotif) {
      await PenaltyNotification.create({
        userId,
        type: 'GATE_PROGRESS',
        tone: 'encouraging',
        title: `Day ${newProgress} of ${GATE_TARGET_DAYS} ✅`,
        message: 'Keep going. Complete 7 consecutive active days to reopen MoveX Bazaar.',
        actionLabel: 'Log tomorrow\'s activity',
        actionLink: '/start',
        meta: { progress: newProgress, target: GATE_TARGET_DAYS },
      });
    }
  }

  return { active: state.gateActive, progress: newProgress, unlocked };
}

// ------------------------------------------------------------
// 6. Check if Bazaar is accessible
// ------------------------------------------------------------
async function isBazaarUnlocked(userId) {
  const state = await WinBackState.findOne({ userId }).lean();
  if (!state) return { unlocked: true }; // normal user
  if (!state.gateActive) return { unlocked: true };
  return {
    unlocked: false,
    progress: state.gateProgress || 0,
    target: GATE_TARGET_DAYS,
    message: `Complete ${GATE_TARGET_DAYS} consecutive active days to reopen MoveX Bazaar.`,
  };
}

// ------------------------------------------------------------
// 7. Sweep all dormant users (called by cron)
// ------------------------------------------------------------
async function sweepDormantUsers() {
  const threshold = new Date(Date.now() - DORMANT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
  const dormant = await WinBackState.find({ isDormant: true }).select('userId').lean();

  let processed = 0;
  for (const s of dormant) {
    try {
      await processDormantNudges(s.userId, s);
      processed++;
    } catch (err) {
      console.error('Win-back nudge failed for', s.userId, err.message);
    }
  }
  return { processed };
}

module.exports = {
  checkDormancy,
  detectReturn,
  claimWelcomeKit,
  updateGateProgress,
  isBazaarUnlocked,
  sweepDormantUsers,
  processDormantNudges,
  DORMANT_THRESHOLD_DAYS,
  GATE_TARGET_DAYS,
};