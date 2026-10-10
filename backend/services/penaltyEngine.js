/**
 * MoveX Penalty Engine
 *
 * Runs once daily per user. Evaluates:
 *   · Days since last activity
 *   · User's consistency score (last 7 days)
 *   · Current active strikes
 *   · Whether the user is dormant (30+ days)
 *
 * Applies the inactivity ladder:
 *   0-2d   Grace           — silent
 *   3-4d   Friendly nudge  — notification only
 *   5-6d   Last chance     — notification only
 *   7-9d   Strike 1        — "Streak at risk"      -10% Energy 3d
 *   10-13d Strike 2        — "Energy bonus paused" -20% Energy + shield off 5d
 *   14-17d Strike 3        — "Restricted mode"     -30% Energy + chat lock 5d
 *   18-29d Restricted      — activity-only mode
 *   30d+   Dormant         — no penalty, win-back armed
 *
 * Consistency grace: if user was active 7/7 or 5+/7 days before inactivity,
 * extend the grace period so loyal users don't get punished for short gaps.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Penalty = require('../models/Penalty');
const Strike = require('../models/Strike');
const PenaltyNotification = require('../models/PenaltyNotification');
const WinBackState = require('../models/WinBackState');

// ------------------------------------------------------------
// CONSTANTS — the ladder
// ------------------------------------------------------------
const STAGES = {
  GRACE:        { key: 'GRACE',        min: 0,  max: 2,  type: null,         reason: null,           severity: null,     durationDays: 0 },
  NUDGE:        { key: 'NUDGE',        min: 3,  max: 4,  type: 'WARNING',    reason: 'INACTIVITY',   severity: 'LOW',    durationDays: 0 },
  LAST_CHANCE:  { key: 'LAST_CHANCE',  min: 5,  max: 6,  type: 'WARNING',    reason: 'INACTIVITY',   severity: 'LOW',    durationDays: 0 },
  STRIKE_1:     { key: 'STRIKE_1',     min: 7,  max: 9,  type: 'STRIKE_1',   reason: 'INACTIVITY',   severity: 'MEDIUM', durationDays: 3 },
  STRIKE_2:     { key: 'STRIKE_2',     min: 10, max: 13, type: 'STRIKE_2',   reason: 'INACTIVITY',   severity: 'HIGH',   durationDays: 5 },
  STRIKE_3:     { key: 'STRIKE_3',     min: 14, max: 17, type: 'STRIKE_3',   reason: 'INACTIVITY',   severity: 'HIGH',   durationDays: 5 },
  RESTRICTED:   { key: 'RESTRICTED',   min: 18, max: 29, type: 'RESTRICTED', reason: 'INACTIVITY',   severity: 'CRITICAL', durationDays: 30 },
  DORMANT:      { key: 'DORMANT',      min: 30, max: Infinity, type: null,   reason: null,           severity: null,     durationDays: 0 },
};

const EFFECTS = {
  STRIKE_1:   { energyMultiplier: 0.90, shieldRemoved: false, chatLocked: false, activityOnly: false },
  STRIKE_2:   { energyMultiplier: 0.80, shieldRemoved: true,  chatLocked: false, activityOnly: false },
  STRIKE_3:   { energyMultiplier: 0.70, shieldRemoved: true,  chatLocked: true,  activityOnly: false },
  RESTRICTED: { energyMultiplier: 0.70, shieldRemoved: true,  chatLocked: true,  activityOnly: true  },
};

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

// ------------------------------------------------------------
// 1. Days since last activity
// ------------------------------------------------------------
async function getDaysSinceLastActivity(userId) {
  const latest = await Activity.findOne({ userId }).sort({ date: -1 }).select('date').lean();
  if (!latest || !latest.date) return 999; // treat as very old
  return daysBetween(new Date(latest.date), new Date());
}

// ------------------------------------------------------------
// 2. Consistency score (activities in last 7 days)
// ------------------------------------------------------------
async function getConsistencyScore(userId) {
  const since = startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const activities = await Activity.find({ userId, date: { $gte: since } })
    .select('date')
    .lean();

  // Count unique days
  const days = new Set(
    activities.map((a) => new Date(a.date).toISOString().split('T')[0])
  );
  return days.size; // 0–7
}

// ------------------------------------------------------------
// 3. Grace period based on user history
// ------------------------------------------------------------
async function getGracePeriod(userId, user) {
  const consistency = await getConsistencyScore(userId);

  // New user (< 14 days old) → biggest grace
  if (user?.createdAt) {
    const accountAgeDays = daysBetween(new Date(user.createdAt), new Date());
    if (accountAgeDays < 14) return 7;
  }

  // Long streak held → protected
  if ((user?.streak || 0) > 14) return 7;

  if (consistency >= 7) return 7;
  if (consistency >= 5) return 5;
  if (consistency >= 3) return 3;
  if (consistency >= 1) return 3;
  return 2;
}

// ------------------------------------------------------------
// 4. Pick stage based on days inactive + grace offset
// ------------------------------------------------------------
function pickStage(daysInactive, graceOffset) {
  // Shift the effective day number back by the grace offset
  // Example: grace = 7 → user needs 7 + 7 = 14 days inactive before Strike 1
  const effectiveDays = Math.max(0, daysInactive - graceOffset);

  for (const stage of Object.values(STAGES)) {
    if (effectiveDays >= stage.min && effectiveDays <= stage.max) {
      return stage;
    }
  }
  return STAGES.GRACE;
}

// ------------------------------------------------------------
// 5. Notification text per stage
// ------------------------------------------------------------
function buildNotification(stage, daysInactive, activeStrikes) {
  const map = {
    NUDGE: {
      tone: 'encouraging',
      title: 'Hey, we miss you! 👋',
      message: `It's been ${daysInactive} days since your last activity. Your progress is safe — no penalty yet. A quick 15-min walk keeps everything going.`,
      actionLabel: 'Take a quick walk',
      actionLink: '/start',
    },
    LAST_CHANCE: {
      tone: 'info',
      title: 'Your streak needs you 🔥',
      message: `${daysInactive} days without an activity. Log one today to keep your streak safe — otherwise a strike starts tomorrow.`,
      actionLabel: 'Save my streak',
      actionLink: '/start',
    },
    STRIKE_1: {
      tone: 'warning',
      title: 'Your streak is at risk ⚠️',
      message: `A 3-day strike was applied because of ${daysInactive} days of inactivity. Energy generation is now at 90%. One activity restores it immediately.`,
      actionLabel: 'Start activity now',
      actionLink: '/start',
    },
    STRIKE_2: {
      tone: 'warning',
      title: 'Energy bonus paused ⚡',
      message: `${daysInactive} days inactive. Your Energy generation is reduced to 80% and the streak shield is off. Log one activity to restore everything.`,
      actionLabel: 'Restore my bonus',
      actionLink: '/start',
    },
    STRIKE_3: {
      tone: 'warning',
      title: 'Restricted mode active 🔒',
      message: `${daysInactive} days inactive. Energy at 70%, chat locked, and full progress paused. A single activity resets this to normal.`,
      actionLabel: 'Reset now',
      actionLink: '/start',
    },
    RESTRICTED: {
      tone: 'warning',
      title: 'Activity-only mode',
      message: `${daysInactive} days inactive. Most features are paused except logging activities. One logged activity brings everything back — we're ready when you are.`,
      actionLabel: 'Start fresh',
      actionLink: '/start',
    },
  };
  return map[stage.key] || null;
}

// ------------------------------------------------------------
// 6. Apply penalty (idempotent for the day)
// ------------------------------------------------------------
async function applyStage(userId, stage) {
  if (!stage.type) return null; // GRACE or DORMANT — nothing to apply

  const today = startOfDay();
  const existing = await Penalty.findOne({
    userId,
    type: stage.type,
    reason: stage.reason,
    appliedAt: { $gte: today },
  });

  if (existing) return existing; // already applied today

  // Resolve any previous inactivity penalty that has expired
  await Penalty.updateMany(
    { userId, reason: 'INACTIVITY', resolved: false, expiresAt: { $lt: new Date() } },
    { $set: { resolved: true, resolvedAt: new Date() } }
  );

  const expiresAt = stage.durationDays > 0
    ? new Date(Date.now() + stage.durationDays * 24 * 60 * 60 * 1000)
    : null;

  const effects = EFFECTS[stage.type] || {
    energyMultiplier: 1, shieldRemoved: false, chatLocked: false, activityOnly: false,
  };

  const penalty = new Penalty({
    userId,
    type: stage.type,
    reason: stage.reason,
    severity: stage.severity,
    effects,
    expiresAt,
  });
  await penalty.save();

  // Create strike record if this is a strike stage
  if (stage.type.startsWith('STRIKE_')) {
    const strikeNumber = parseInt(stage.type.split('_')[1], 10);
    await Strike.create({
      userId,
      penaltyId: penalty._id,
      strikeNumber,
      reason: stage.reason,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  return penalty;
}

// ------------------------------------------------------------
// 7. Notification dispatch
// ------------------------------------------------------------
async function dispatchNotification(userId, stage, daysInactive) {
  if (!stage.type && stage.key !== 'NUDGE' && stage.key !== 'LAST_CHANCE') return null;

  const content = buildNotification(stage, daysInactive);
  if (!content) return null;

  // Prevent duplicate same-day notifications of same type
  const today = startOfDay();
  const existing = await PenaltyNotification.findOne({
    userId,
    type: stage.key,
    createdAt: { $gte: today },
  });
  if (existing) return existing;

  const notification = await PenaltyNotification.create({
    userId,
    type: stage.key,
    tone: content.tone,
    title: content.title,
    message: content.message,
    actionLabel: content.actionLabel,
    actionLink: content.actionLink,
    meta: { daysInactive },
  });
  return notification;
}

// ------------------------------------------------------------
// 8. Public API — evaluate one user
// ------------------------------------------------------------
async function evaluateUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return { skipped: true, reason: 'user_not_found' };

  const daysInactive = await getDaysSinceLastActivity(userId);

  // Already dormant — win-back handles this, skip penalties
  const wbState = await WinBackState.findOne({ userId }).lean();
  if (wbState?.isDormant) {
    return { skipped: true, reason: 'dormant' };
  }

  const grace = await getGracePeriod(userId, user);
  const stage = pickStage(daysInactive, grace);

  if (stage.key === 'GRACE') {
    return { user: userId, stage: 'GRACE', daysInactive, grace };
  }

  if (stage.key === 'DORMANT') {
    return { user: userId, stage: 'DORMANT', daysInactive, grace, handoff: 'winback' };
  }

  const penalty = await applyStage(userId, stage);
  const notification = await dispatchNotification(userId, stage, daysInactive);

  // If user logged activity, auto-resolve all open inactivity penalties
  if (daysInactive === 0) {
    await Penalty.updateMany(
      { userId, reason: 'INACTIVITY', resolved: false },
      { $set: { resolved: true, resolvedAt: new Date() } }
    );
    await Strike.updateMany(
      { userId, reason: 'INACTIVITY', resolved: false },
      { $set: { resolved: true, resolvedAt: new Date(), resolvedBy: 'ACTIVITY' } }
    );
  }

  return {
    user: userId,
    stage: stage.key,
    daysInactive,
    grace,
    penaltyApplied: !!penalty,
    notificationSent: !!notification,
  };
}

// ------------------------------------------------------------
// 9. Compute active effects for a user (used by Activity routes)
// ------------------------------------------------------------
async function getActiveEffects(userId) {
  const now = new Date();
  const active = await Penalty.find({
    userId,
    resolved: false,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).lean();

  const combined = {
    energyMultiplier: 1,
    shieldRemoved: false,
    chatLocked: false,
    activityOnly: false,
    activePenalties: active.length,
  };

  for (const p of active) {
    combined.energyMultiplier = Math.min(combined.energyMultiplier, p.effects.energyMultiplier ?? 1);
    combined.shieldRemoved = combined.shieldRemoved || p.effects.shieldRemoved;
    combined.chatLocked = combined.chatLocked || p.effects.chatLocked;
    combined.activityOnly = combined.activityOnly || p.effects.activityOnly;
  }

  return combined;
}

module.exports = {
  evaluateUser,
  getActiveEffects,
  getDaysSinceLastActivity,
  getConsistencyScore,
  getGracePeriod,
  STAGES,
  EFFECTS,
};