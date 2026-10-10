/**
 * Session history + scoring.
 * Ported from AR Fit (TS to JS).
 *
 * Stays on-device (localStorage). MoveX integration happens in Phase 7.
 */
import { FLAG_CUES } from './formRules.js';

const DEPTH_ISSUE = {
  squat: 'Go deeper: hips to knee level',
  pushup: 'Lower your chest closer to the floor',
};

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

export function summarize(args) {
  const { log } = args;
  const scores = log.map((r) => r.score);
  const accuracy = scores.length
    ? clamp(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const counts = new Map();
  for (const r of log) {
    for (const f of new Set(r.flags)) {
      const label = (FLAG_CUES[f] && FLAG_CUES[f].text) || f;
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    if (r.shallow) {
      const label = DEPTH_ISSUE[args.exerciseId] || 'Go deeper';
      counts.set(label, (counts.get(label) || 0) + 1);
    }
  }
  if (args.partials > 0) {
    const label = DEPTH_ISSUE[args.exerciseId] || 'Go deeper';
    counts.set(label, Math.max(counts.get(label) || 0, Math.min(log.length, args.partials)));
  }

  const issues = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .filter((i) => i.count >= Math.max(1, Math.round(log.length * 0.2)))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const focus = issues[0] && issues[0].label.toLowerCase();
  let remark;
  if (!log.length) remark = 'No reps were counted.';
  else if (accuracy >= 90) remark = 'Excellent form. Keep it up.';
  else if (accuracy >= 75) remark = focus ? `Good set. Small fix: ${focus}.` : 'Good set. A few small slips.';
  else if (accuracy >= 55) remark = focus ? `Form slipped. Focus on: ${focus}.` : 'Form slipped. Slow down and control each rep.';
  else remark = focus ? `Form needs work. Slow down and focus on: ${focus}.` : 'Form needs work. Slow down and control each rep.';

  return {
    id: String(Date.now()),
    date: new Date().toISOString(),
    exerciseId: args.exerciseId,
    exercise: args.exercise,
    reps: log.length,
    target: args.target,
    accuracy,
    durationSec: args.durationSec,
    best: scores.length ? Math.max(...scores) : 0,
    worst: scores.length ? Math.min(...scores) : 0,
    repScores: scores,
    partials: args.partials,
    issues,
    remark,
  };
}

/** Score for one rep: avg posture quality while moving, minus penalties for flagged errors. */
export function scoreRep(avgAlignment, flags, shallow) {
  return clamp(avgAlignment - 8 * flags.length - (shallow ? 10 : 0));
}

/* ---------------- storage (on-device, localStorage) ---------------- */

const KEY = 'arfit.sessions.v1';

export function loadSessions() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveSession(s) {
  try {
    const all = [s, ...loadSessions()].slice(0, 300);
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

export function clearSessions() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}