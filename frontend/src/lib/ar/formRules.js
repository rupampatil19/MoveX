/**
 * Form rules for squats and push-ups.
 * Ported from AR Fit (TS to JS).
 */
import { jointAngle, dist, visible } from './geometry.js';

const RAD = 180 / Math.PI;

export const SQUAT_RULES = {
  knee: { perfect: [70, 90], tooDeepBelow: 60, shallowAbove: 100 },
  trunk: { perfect: [65, 80], goodMorningBelow: 60, hyperExtAbove: 90 },
  hinge: { perfect: [80, 100], collapseBelow: 75 },
  spineMaxDev: 10,
  spineProxyWarn: 25,
  spineProxyBad: 35,
  trunkTibiaMax: 10,
  kneeTravelMax: 0.1,
  standingKnee: 160,
  leaveStandingKnee: 150,
  bottomKnee: 100,
  hipLevelTol: 0.08,
  ascentRatioMax: 1.4,
  footToTibia: 0.62,
};

export const PUSHUP_RULES = {
  elbow: { perfect: [70, 90], shallowAbove: 100 },
  abduction: { perfect: [20, 45], flareAbove: 75 },
  hip: { perfect: [170, 180], sagBelow: 160, pikeAbove: 195 },
  plankMaxDev: 10,
  neckMaxDev: 15,
  standingElbow: 160,
  leaveStandingElbow: 150,
  bottomElbow: 100,
  chestFloorFrac: 0.55,
  riseRatioTol: [0.5, 1.6],
};

const ok = () => ({ level: 'good' });
const warn = () => ({ level: 'warn' });
const bad = (flag) => ({ level: 'bad', flag });
const between = (v, range) => v >= range[0] && v <= range[1];

export function vecAngle(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x) * RAD;
}

export function angleDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function pickSide(kps, parts, minScore = 0.3) {
  let best = null;
  let bestC = -1;
  for (const s of ['left', 'right']) {
    const pts = parts.map((p) => kps[s + '_' + p]);
    if (pts.some((p) => !visible(p, minScore))) continue;
    const c = pts.reduce((acc, p) => acc + (p.score || 0), 0) / pts.length;
    if (c > bestC) {
      bestC = c;
      best = s;
    }
  }
  return best;
}

export function facingDir(kps, side) {
  const nose = kps['nose'];
  if (!visible(nose, 0.3)) return null;
  const ears = [kps['left_ear'], kps['right_ear']].filter((p) => visible(p, 0.3));
  const sh = side ? kps[side + '_shoulder'] : undefined;
  let ref = null;
  if (ears.length) ref = ears.reduce((a, p) => a + p.x, 0) / ears.length;
  else if (visible(sh)) ref = sh.x;
  if (ref === null) return null;
  const dx = nose.x - ref;
  const unit = visible(sh) && visible(kps[side + '_hip']) ? dist(sh, kps[side + '_hip']) : 100;
  if (Math.abs(dx) < 0.04 * unit) return null;
  return dx > 0 ? 1 : -1;
}

export function forwardLean(from, to, facing) {
  return Math.atan2((to.x - from.x) * facing, -(to.y - from.y)) * RAD;
}

export function spineDeviation(kps, side) {
  const sh = kps[side + '_shoulder'];
  const hp = kps[side + '_hip'];
  const mt = kps['mid_trunk'];
  if (visible(sh) && visible(hp) && visible(mt)) {
    return { dev: angleDiff(vecAngle(sh, mt), vecAngle(mt, hp)), approx: false };
  }
  const ear = kps[side + '_ear'];
  if (visible(sh) && visible(hp) && visible(ear)) {
    return { dev: 180 - jointAngle(ear, sh, hp), approx: true };
  }
  return null;
}

export function squatFeatures(kps, prevFacing) {
  const side = pickSide(kps, ['shoulder', 'hip', 'knee', 'ankle']);
  if (!side) return null;
  const shoulder = kps[side + '_shoulder'];
  const hip = kps[side + '_hip'];
  const knee = kps[side + '_knee'];
  const ankle = kps[side + '_ankle'];

  let facing = facingDir(kps, side);
  if (facing === null) facing = prevFacing;
  if (facing === null) {
    const dx = knee.x - (hip.x + ankle.x) / 2;
    facing = dx >= 0 ? 1 : -1;
  }

  const femurLen = dist(hip, knee);
  const tibiaLen = dist(knee, ankle);
  const trunkLean = forwardLean(hip, shoulder, facing);
  const tibiaLean = forwardLean(ankle, knee, facing);
  const toeX = ankle.x + facing * SQUAT_RULES.footToTibia * tibiaLen;

  return {
    side,
    facing,
    shoulder,
    hip,
    knee,
    ankle,
    kneeDeg: jointAngle(hip, knee, ankle),
    trunkAngle: 90 - trunkLean,
    hingeDeg: jointAngle(shoulder, hip, knee),
    trunkTibiaDiff: Math.abs(trunkLean - tibiaLean),
    femurLen,
    tibiaLen,
    kneeTravel: ((knee.x - toeX) * facing) / Math.max(1e-3, femurLen),
    hipLevel: hip.y >= knee.y - SQUAT_RULES.hipLevelTol * femurLen,
    spine: spineDeviation(kps, side),
  };
}

export function classifyKnee(deg) {
  const r = SQUAT_RULES.knee;
  if (deg < r.tooDeepBelow) return bad('Too Deep');
  if (deg > r.shallowAbove) return bad('Shallow Squat');
  return between(deg, r.perfect) ? ok() : warn();
}

export function classifyTrunk(angle) {
  const r = SQUAT_RULES.trunk;
  if (angle < r.goodMorningBelow) return bad('Good Morning Error');
  if (angle > r.hyperExtAbove) return bad('Spinal Hyper-extension');
  return between(angle, r.perfect) ? ok() : warn();
}

export function classifyHinge(deg) {
  const r = SQUAT_RULES.hinge;
  if (deg < r.collapseBelow) return bad('Hip Collapse');
  return between(deg, r.perfect) ? ok() : warn();
}

export function classifyTrunkTibia(diff) {
  const max = SQUAT_RULES.trunkTibiaMax;
  if (diff <= max) return ok();
  return diff <= max * 1.5 ? warn() : bad('Excessive Forward Lean');
}

export function classifyKneeTravel(frac) {
  const max = SQUAT_RULES.kneeTravelMax;
  if (frac <= max) return ok();
  return frac <= max * 1.5 ? warn() : bad('Knees Too Far Forward');
}

export function classifySpine(s) {
  if (s.approx) {
    if (s.dev <= SQUAT_RULES.spineProxyWarn) return ok();
    return s.dev <= SQUAT_RULES.spineProxyBad ? warn() : bad('Rounded Back');
  }
  const max = SQUAT_RULES.spineMaxDev;
  if (s.dev <= max) return ok();
  return s.dev <= max * 1.5 ? warn() : bad('Butt Wink');
}

export function hipAlignmentSigned(s, h, a) {
  const theta = jointAngle(s, h, a);
  const dx = a.x - s.x;
  if (Math.abs(dx) < 1e-3) return theta;
  const lineY = s.y + (a.y - s.y) * ((h.x - s.x) / dx);
  return h.y < lineY ? 360 - theta : theta;
}

export function pushupFeatures(kps) {
  const side = pickSide(kps, ['shoulder', 'elbow', 'wrist', 'hip', 'ankle']);
  if (!side) return null;
  const shoulder = kps[side + '_shoulder'];
  const elbow = kps[side + '_elbow'];
  const wrist = kps[side + '_wrist'];
  const hip = kps[side + '_hip'];
  const ankle = kps[side + '_ankle'];
  const ear = visible(kps[side + '_ear']) ? kps[side + '_ear'] : null;
  const armLen = dist(shoulder, elbow) + dist(elbow, wrist);

  return {
    side, shoulder, elbow, wrist, hip, ankle, ear,
    elbowDeg: jointAngle(shoulder, elbow, wrist),
    hipDeg: hipAlignmentSigned(shoulder, hip, ankle),
    plankDev: angleDiff(vecAngle(shoulder, hip), vecAngle(hip, ankle)),
    neckDev: ear ? angleDiff(vecAngle(shoulder, ear), vecAngle(hip, shoulder)) : null,
    abductionDeg: jointAngle(hip, shoulder, elbow),
    armLen,
    chestDown: wrist.y - shoulder.y <= PUSHUP_RULES.chestFloorFrac * armLen,
  };
}

export function classifyElbowBottom(deg) {
  const r = PUSHUP_RULES.elbow;
  if (deg > r.shallowAbove) return bad('Shallow Rep');
  return deg <= r.perfect[1] ? ok() : warn();
}

export function classifyAbduction(deg) {
  const r = PUSHUP_RULES.abduction;
  if (deg > r.flareAbove) return bad('Elbow Flaring');
  return between(deg, r.perfect) ? ok() : warn();
}

export function classifyHipAlignment(v) {
  const r = PUSHUP_RULES.hip;
  if (v < r.sagBelow) return bad('Sagging Hips');
  if (v > r.pikeAbove) return bad('Hiked Hips');
  return between(v, r.perfect) ? ok() : warn();
}

export function classifyPlank(dev) {
  const max = PUSHUP_RULES.plankMaxDev;
  if (dev <= max) return ok();
  return dev <= max * 1.5 ? warn() : bad('Broken Plank');
}

export function classifyNeck(dev) {
  const max = PUSHUP_RULES.neckMaxDev;
  if (dev <= max) return ok();
  return dev <= max * 1.5 ? warn() : bad('Head Dropping');
}

export class FlagTracker {
  constructor(minRun = 4) {
    this.minRun = minRun;
    this.runs = new Map();
    this.set = new Set();
  }
  hit(flag, active) {
    if (!active) { this.runs.set(flag, 0); return; }
    const n = (this.runs.get(flag) || 0) + 1;
    this.runs.set(flag, n);
    if (n >= this.minRun) this.set.add(flag);
  }
  has(flag) { return this.set.has(flag); }
  list() { return [...this.set]; }
  clear() { this.runs.clear(); this.set.clear(); }
}

export const FLAG_CUES = {
  'Shallow Squat': { text: 'Go deeper', dir: 'down' },
  'Too Deep': { text: 'Not so deep', dir: 'up' },
  'Good Morning Error': { text: 'Chest up', dir: 'up' },
  'Spinal Hyper-extension': { text: 'Do not lean back', dir: 'hold' },
  'Hip Collapse': { text: 'Sit hips back', dir: 'hold' },
  'Excessive Forward Lean': { text: 'Weight back on your heels', dir: 'hold' },
  'Knees Too Far Forward': { text: 'Knees back', dir: 'hold' },
  'Butt Wink': { text: 'Keep lower back flat', dir: 'hold' },
  'Rounded Back': { text: 'Chest up, back straight', dir: 'hold' },
  'Rushed Ascent': { text: 'Hips and chest up together', dir: 'hold' },
  'Shallow Rep': { text: 'Lower your chest', dir: 'down' },
  'Elbow Flaring': { text: 'Tuck your elbows', dir: 'hold' },
  'Sagging Hips': { text: 'Lift your hips', dir: 'up' },
  'Hiked Hips': { text: 'Lower your hips', dir: 'down' },
  'Broken Plank': { text: 'Keep your body in one line', dir: 'hold' },
  'Head Dropping': { text: 'Keep your neck neutral', dir: 'hold' },
  'Uneven Rise': { text: 'Rise hips and shoulders together', dir: 'hold' },
};

export const LIVE_CUE_PRIORITY = {
  squat: ['Good Morning Error', 'Too Deep', 'Knees Too Far Forward', 'Butt Wink', 'Rounded Back'],
  pushup: ['Sagging Hips', 'Hiked Hips', 'Elbow Flaring'],
};

export const DEPTH_CUE = {
  squat: 'Go deeper',
  pushup: 'Lower your chest',
};

export const levelQuality = { good: 1, warn: 0.7, bad: 0.3 };