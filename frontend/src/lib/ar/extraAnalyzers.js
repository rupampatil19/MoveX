/**
 * Extra form analyzers for burpee, sit-ups, jumping jacks, and plank.
 * Ported from ARFit v6 (extraAnalyzers.ts -> JS).
 */
import { jointAngle, visible } from './geometry.js';

const deg = (v) => `${Math.round(v)}\u00B0`;
const clamp = (v, lo = 0, hi = 180) => Math.max(lo, Math.min(hi, v));
const point = (kps, name) => (visible(kps[name]) ? kps[name] : null);

function chooseSide(kps, chain) {
  const left = chain.map((n) => point(kps, n.replace('SIDE', 'left')));
  const right = chain.map((n) => point(kps, n.replace('SIDE', 'right')));
  const score = (xs) => xs.every(Boolean) ? xs.reduce((sum, p) => sum + (p?.score ?? 0), 0) : -1;
  const selected = score(left) >= score(right) ? left : right;
  return selected.every(Boolean) ? selected : null;
}

function baseResult(args) {
  const quality = { good: 100, idle: 75, warn: 65, bad: 30 };
  const vals = args.checks.map((c) => quality[c.status]);
  const alignment = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  const adjustments = [...(args.extra || [])];
  if (args.flags.includes('Sagging Hips')) adjustments.push({ dir: 'up', text: 'Lift hips into a straight line' });
  if (args.flags.includes('Hiked Hips')) adjustments.push({ dir: 'down', text: 'Lower hips in line with shoulders' });
  if (args.flags.includes('Neck Not Neutral')) adjustments.push({ dir: 'hold', text: 'Keep your head aligned with your back' });
  if (args.flags.includes('Uneven Arms')) adjustments.push({ dir: 'hold', text: 'Raise both arms evenly' });
  return {
    checks: args.checks,
    adjustments: adjustments.slice(0, 3),
    alignment,
    phase: args.phase ?? 'transition',
    angles: [{ name: args.angleName, deg: args.angle, at: args.at }],
    repAngle: args.repAngle,
    handDistanceRatio: null,
    perfect: alignment >= 88 && args.flags.length === 0,
    visibleBody: args.visibleBody,
    flags: args.flags,
    aux: { secondaryDown: null },
  };
}

const statusFor = (ok, caution) => ok ? 'good' : caution ? 'warn' : 'bad';
const noBody = () => ({ checks: [], adjustments: [], alignment: 0, phase: 'unknown', angles: [], repAngle: null, handDistanceRatio: null, perfect: false, visibleBody: false, flags: [], aux: { secondaryDown: null } });

/** Side-view forearm plank analyzer. Coaching heuristics, not medical limits. */
export class PlankAnalyzer {
  constructor() { this.lastRepFlags = []; }
  reset() { this.lastRepFlags = []; }
  analyze(kps) {
    const body = chooseSide(kps, ['SIDE_shoulder', 'SIDE_hip', 'SIDE_ankle']);
    if (!body) return noBody();
    const [shoulder, hip, ankle] = body;
    const bodyLine = jointAngle(shoulder, hip, ankle);
    const elbowChain = chooseSide(kps, ['SIDE_shoulder', 'SIDE_elbow', 'SIDE_wrist']);
    const elbow = elbowChain ? jointAngle(...elbowChain) : null;
    const ear = point(kps, 'left_ear') ?? point(kps, 'right_ear');
    const neck = ear ? jointAngle(ear, shoulder, hip) : null;
    const lineOk = bodyLine >= 170 && bodyLine <= 190;
    const lineCaution = (bodyLine >= 160 && bodyLine < 170) || (bodyLine > 190 && bodyLine <= 195);
    const elbowOk = elbow === null || (elbow >= 70 && elbow <= 110);
    const elbowCaution = elbow === null || (elbow >= 60 && elbow <= 120);
    const neckOk = neck === null || neck >= 165;
    const neckCaution = neck === null || neck >= 150;
    const checks = [
      { id: 'body-line', label: 'BODY LINE', value: deg(bodyLine), status: statusFor(lineOk, lineCaution) },
      ...(elbow === null ? [] : [{ id: 'elbow', label: 'ELBOW', value: deg(elbow), status: statusFor(elbowOk, elbowCaution) }]),
      ...(neck === null ? [] : [{ id: 'neck', label: 'NECK', value: deg(neck), status: statusFor(neckOk, neckCaution) }]),
    ];
    const flags = [...(bodyLine < 160 ? ['Sagging Hips'] : []), ...(bodyLine > 195 ? ['Hiked Hips'] : []), ...(neck !== null && neck < 150 ? ['Neck Not Neutral'] : [])];
    this.lastRepFlags = flags;
    return baseResult({ checks, angleName: 'BODY LINE', angle: bodyLine, at: hip, repAngle: bodyLine, flags, visibleBody: true, phase: 'up', extra: [{ dir: 'hold', text: 'Breathe steadily; keep shoulders above elbows' }] });
  }
}

/** Sit-up: transformed shoulder-hip-knee angle is high curled up, low reclined. */
export class SitupAnalyzer {
  constructor() { this.lastRepFlags = []; }
  reset() { this.lastRepFlags = []; }
  analyze(kps) {
    const chain = chooseSide(kps, ['SIDE_shoulder', 'SIDE_hip', 'SIDE_knee']);
    if (!chain) return noBody();
    const [shoulder, hip, knee] = chain;
    const hipAngle = jointAngle(shoulder, hip, knee);
    const curl = clamp(180 - hipAngle);
    const ear = point(kps, 'left_ear') ?? point(kps, 'right_ear');
    const neckAngle = ear ? jointAngle(ear, shoulder, hip) : null;
    const checks = [
      { id: 'curl', label: 'CURL', value: deg(curl), status: curl >= 60 ? 'good' : curl >= 35 ? 'warn' : 'idle' },
      ...(neckAngle === null ? [] : [{ id: 'neck', label: 'NECK', value: deg(neckAngle), status: neckAngle >= 145 ? 'good' : 'warn' }]),
    ];
    const flags = neckAngle !== null && neckAngle < 130 ? ['Neck Not Neutral'] : [];
    this.lastRepFlags = flags;
    return baseResult({ checks, angleName: 'HIP FLEXION', angle: curl, at: hip, repAngle: hipAngle, flags, visibleBody: true, phase: hipAngle >= 150 ? 'up' : hipAngle <= 100 ? 'down' : 'transition', extra: [{ dir: 'hold', text: 'Curl your torso; avoid pulling your head forward' }] });
  }
}

/** Jumping jack: inverse shoulder-to-hip/wrist angle, high with arms down, low overhead. */
export class JumpingJackAnalyzer {
  constructor() { this.lastRepFlags = []; }
  reset() { this.lastRepFlags = []; }
  analyze(kps) {
    const left = [point(kps, 'left_hip'), point(kps, 'left_shoulder'), point(kps, 'left_wrist')];
    const right = [point(kps, 'right_hip'), point(kps, 'right_shoulder'), point(kps, 'right_wrist')];
    const angleFor = (a) => a.every(Boolean) ? 180 - jointAngle(a[0], a[1], a[2]) : null;
    const l = angleFor(left), r = angleFor(right);
    const observed = [l, r].filter((v) => v !== null);
    if (!observed.length) return noBody();
    const inverseAngle = observed.reduce((a, b) => a + b, 0) / observed.length;
    const elevation = 180 - inverseAngle;
    const symmetric = l === null || r === null || Math.abs(l - r) <= 25;
    const checks = [
      { id: 'arms', label: 'ARM RAISE', value: `${Math.round(elevation)}\u00B0`, status: elevation >= 100 ? 'good' : elevation >= 65 ? 'warn' : 'idle' },
      { id: 'symmetry', label: 'SYMMETRY', value: l !== null && r !== null ? `${Math.round(Math.abs(l - r))}\u00B0` : '\u2013', status: symmetric ? 'good' : 'warn' },
    ];
    const flags = symmetric ? [] : ['Uneven Arms'];
    this.lastRepFlags = flags;
    const shoulder = point(kps, 'left_shoulder') ?? point(kps, 'right_shoulder');
    return baseResult({ checks, angleName: 'ARM RAISE', angle: elevation, at: shoulder, repAngle: inverseAngle, flags, visibleBody: true, phase: inverseAngle >= 155 ? 'up' : inverseAngle <= 80 ? 'down' : 'transition', extra: [{ dir: 'hold', text: 'Land softly and return arms and feet together' }] });
  }
}

/** Burpee rep signal: knee flexion, suppressed while the straight-knee body is planked. */
export class BurpeeAnalyzer {
  constructor() { this.lastRepFlags = []; }
  reset() { this.lastRepFlags = []; }
  analyze(kps) {
    const kneeChain = chooseSide(kps, ['SIDE_hip', 'SIDE_knee', 'SIDE_ankle']);
    const torsoChain = chooseSide(kps, ['SIDE_shoulder', 'SIDE_hip', 'SIDE_knee']);
    if (!kneeChain || !torsoChain) return noBody();
    const kneeAngle = jointAngle(...kneeChain);
    const [shoulder, hip] = torsoChain;
    const torsoLength = Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y);
    const torsoVerticality = torsoLength > 0 ? Math.abs(shoulder.y - hip.y) / torsoLength : 0;
    const repAngle = torsoVerticality < 0.45 ? 115 : kneeAngle;
    const checks = [
      { id: 'knee', label: 'KNEE FLEX', value: deg(kneeAngle), status: kneeAngle <= 115 ? 'good' : kneeAngle <= 140 ? 'warn' : 'idle' },
      { id: 'torso', label: 'TORSO', value: `${Math.round(torsoVerticality * 100)}% upright`, status: torsoVerticality > 0.45 ? 'good' : 'idle' },
    ];
    this.lastRepFlags = [];
    return baseResult({ checks, angleName: 'KNEES', angle: kneeAngle, at: kneeChain[1], repAngle, flags: [], visibleBody: true, phase: repAngle >= 160 ? 'up' : repAngle <= 100 ? 'down' : 'transition', extra: [{ dir: 'hold', text: 'Keep your core firm in plank and land softly' }] });
  }
}
