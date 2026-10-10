import API from '../api';

/**
 * MoveX Penalty System — API client
 * All methods fail-soft (return null on error) so the app never breaks
 * if the penalty backend is unavailable.
 */

export async function getPenaltyState() {
  try {
    const { data } = await API.get('/penalties/me');
    return data;
  } catch (err) {
    if (err.response?.status !== 404) console.warn('penalty/me failed', err.message);
    return null;
  }
}

export async function getPenaltyHistory() {
  try {
    const { data } = await API.get('/penalties/history');
    return data;
  } catch (err) {
    return { penalties: [], strikes: [] };
  }
}

export async function getNotifications() {
  try {
    const { data } = await API.get('/penalties/notifications');
    return data;
  } catch (err) {
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationRead(id) {
  try {
    await API.post(`/penalties/notifications/${id}/read`);
    return true;
  } catch (err) {
    return false;
  }
}

export async function dismissNotification(id) {
  try {
    await API.post(`/penalties/notifications/${id}/dismiss`);
    return true;
  } catch (err) {
    return false;
  }
}

export async function snoozeNotification(id, hours = 24) {
  try {
    const { data } = await API.post(`/penalties/notifications/${id}/snooze`, { hours });
    return data;
  } catch (err) {
    return null;
  }
}

export async function getBazaarStatus() {
  try {
    const { data } = await API.get('/penalties/bazaar-status');
    return data;
  } catch (err) {
    return { unlocked: true };
  }
}

export async function getWinBackStatus() {
  try {
    const { data } = await API.get('/penalties/winback-status');
    return data;
  } catch (err) {
    return {
      isDormant: false,
      winBackClaimed: false,
      gateActive: false,
      gateProgress: 0,
      target: 7,
    };
  }
}

export async function detectReturn() {
  try {
    const { data } = await API.post('/penalties/detect-return');
    return data;
  } catch (err) {
    return { returning: false };
  }
}

export async function claimWelcomeKit() {
  try {
    const { data } = await API.post('/penalties/claim-welcome');
    return data;
  } catch (err) {
    return { ok: false, error: err.response?.data?.error || 'claim_failed' };
  }
}

export async function evaluateMe() {
  try {
    const { data } = await API.post('/penalties/evaluate-me');
    return data;
  } catch (err) {
    return null;
  }
}