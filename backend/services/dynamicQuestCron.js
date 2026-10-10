const cron = require('node-cron');
const { startEventResearch } = require('./tinyfishService');

const CITIES = ['Pune', 'Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad'];

function buildWebhookUrl() {
  const host = process.env.RENDER_EXTERNAL_HOSTNAME;
  if (host) return 'https://' + host + '/api/dynamic-quests/webhook';
  const base = process.env.BACKEND_URL || 'http://localhost:5000';
  return base.replace(/\/$/, '') + '/api/dynamic-quests/webhook';
}

async function runWeeklyResearch() {
  console.log('[DynamicQuestCron] weekly run starting -', new Date().toISOString());
  const webhookUrl = buildWebhookUrl();
  for (const city of CITIES) {
    try {
      await startEventResearch(city, webhookUrl);
      console.log('[DynamicQuestCron] research triggered for', city);
    } catch (err) {
      console.error('[DynamicQuestCron] failed for', city, err.message);
    }
  }
}

function startDynamicQuestCron() {
  // Monday 06:00 IST = Sunday 00:30 UTC
  cron.schedule('30 0 * * 1', runWeeklyResearch);
  console.log('[DynamicQuestCron] scheduler armed (Mon 06:00 IST)');
}

module.exports = { startDynamicQuestCron, runWeeklyResearch, CITIES };
