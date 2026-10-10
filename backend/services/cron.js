/**
 * MoveX Daily Cron
 *
 * Runs once every 24 hours. In production this should be triggered by
 * an external scheduler (Render cron job) calling POST /internal/cron/daily.
 *
 * If you want an in-process cron, uncomment the setInterval block below.
 * Note: Render free tier will sleep the backend, so external cron is preferred.
 */

const User = require('../models/User');
const Strike = require('../models/Strike');
const Penalty = require('../models/Penalty');
const WinBackState = require('../models/WinBackState');
const penaltyEngine = require('./penaltyEngine');
const winBackService = require('./winBackService');

// ------------------------------------------------------------
// 1. Expire old strikes
// ------------------------------------------------------------
async function expireStrikes() {
  const result = await Strike.updateMany(
    { resolved: false, expiresAt: { $lt: new Date() } },
    { $set: { resolved: true, resolvedAt: new Date(), resolvedBy: 'TIME' } }
  );
  return { expiredStrikes: result.modifiedCount };
}

// ------------------------------------------------------------
// 2. Expire old penalties
// ------------------------------------------------------------
async function expirePenalties() {
  const result = await Penalty.updateMany(
    { resolved: false, expiresAt: { $ne: null, $lt: new Date() } },
    { $set: { resolved: true, resolvedAt: new Date() } }
  );
  return { expiredPenalties: result.modifiedCount };
}

// ------------------------------------------------------------
// 3. Evaluate all users' inactivity
// ------------------------------------------------------------
async function evaluateAllUsers() {
  // Skip users already dormant — winBackService handles them
  const dormantIds = await WinBackState.find({ isDormant: true }).distinct('userId');
  const users = await User.find({ _id: { $nin: dormantIds } })
    .select('_id createdAt streak')
    .lean();

  let evaluated = 0;
  let penaltiesApplied = 0;
  let notificationsSent = 0;
  let dormancyTriggered = 0;

  for (const u of users) {
    try {
      const res = await penaltyEngine.evaluateUser(u._id);

      if (res.handoff === 'winback') {
        // User reached 30+ days → hand off to win-back
        await winBackService.checkDormancy(u._id);
        dormancyTriggered++;
        continue;
      }

      evaluated++;
      if (res.penaltyApplied) penaltiesApplied++;
      if (res.notificationSent) notificationsSent++;
    } catch (err) {
      console.error('Daily evaluation failed for', u._id, err.message);
    }
  }

  return { evaluated, penaltiesApplied, notificationsSent, dormancyTriggered };
}

// ------------------------------------------------------------
// 4. Full daily run
// ------------------------------------------------------------
async function runDailyCron() {
  const start = Date.now();
  console.log('[CRON] Daily run started at', new Date().toISOString());

  try {
    const strikes = await expireStrikes();
    console.log('[CRON] Strikes expired:', strikes.expiredStrikes);

    const penalties = await expirePenalties();
    console.log('[CRON] Penalties expired:', penalties.expiredPenalties);

    const evaluation = await evaluateAllUsers();
    console.log('[CRON] Users evaluated:', evaluation.evaluated);
    console.log('[CRON] Penalties applied:', evaluation.penaltiesApplied);
    console.log('[CRON] Notifications sent:', evaluation.notificationsSent);
    console.log('[CRON] Dormancy triggered:', evaluation.dormancyTriggered);

    const winback = await winBackService.sweepDormantUsers();
    console.log('[CRON] Dormant users nudged:', winback.processed);

    const elapsed = Date.now() - start;
    console.log(`[CRON] Daily run finished in ${elapsed}ms`);

    return {
      ok: true,
      elapsedMs: elapsed,
      ...strikes,
      ...penalties,
      ...evaluation,
      dormantNudged: winback.processed,
    };
  } catch (err) {
    console.error('[CRON] Daily run failed:', err);
    return { ok: false, error: err.message };
  }
}

// ------------------------------------------------------------
// 5. Optional in-process scheduler
//    Enable this only if you have a long-running server
//    (Render free tier sleeps → use external cron instead)
// ------------------------------------------------------------
function startDailyScheduler(intervalHours = 24) {
  const MS = intervalHours * 60 * 60 * 1000;
  console.log(`[CRON] In-process scheduler started (${intervalHours}h interval)`);

  // First run: 10s after boot (allow server to be ready)
  setTimeout(() => {
    runDailyCron().catch((e) => console.error('Boot cron failed:', e));
  }, 10 * 1000);

  // Then every intervalHours
  setInterval(() => {
    runDailyCron().catch((e) => console.error('Scheduled cron failed:', e));
  }, MS);
}

module.exports = {
  runDailyCron,
  startDailyScheduler,
  expireStrikes,
  expirePenalties,
  evaluateAllUsers,
};