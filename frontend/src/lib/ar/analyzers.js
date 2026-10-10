/**
 * Form analyzers for squats and push-ups.
 * Ported from AR Fit (TS to JS).
 *
 * Each analyzer:
 *  - Runs a state machine (standing -> descending -> bottom -> ascending)
 *  - Computes BodyChecks with good/warn/bad status
 *  - Tracks flags across frames via FlagTracker
 *  - Emits an AnalysisResult for the UI to render
 */
import { dist, isFrontal } from './geometry.js';
import {
  FLAG_CUES,
  FlagTracker,
  PUSHUP_RULES,
  SQUAT_RULES,
  classifyAbduction,
  classifyElbowBottom,
  classifyHinge,
  classifyHipAlignment,
  classifyKnee,
  classifyKneeTravel,
  classifyNeck,
  classifyPlank,
  classifySpine,
  classifyTrunk,
  classifyTrunkTibia,
  levelQuality,
  pushupFeatures,
  squatFeatures,
} from './formRules.js';

const STAGE_PHASE = {
  standing: 'up',
  descending: 'transition',
  bottom: 'down',
  ascending: 'transition',
};

const deg = (v) => `${Math.round(v)}\u00B0`;

/** Short rolling window of hip/shoulder heights to estimate vertical speed. */
class Trail {
  s = [];

  push(t, hip, sh) {
    this.s.push({ t, hip, sh });
    while (this.s.length && t - this.s[0].t > 600) this.s.shift();
  }

  /** Upward travel (+ = up) over the window, in pixels; null if the window is too short. */
  rise() {
    if (this.s.length < 4) return null;
    const a = this.s[0];
    const b = this.s[this.s.length - 1];
    if (b.t - a.t < 250) return null;
    return { hip: a.hip - b.hip, sh: a.sh - b.sh };
  }

  clear() {
    this.s = [];
  }
}

function empty() {
  return {
    checks: [],
    adjustments: [],
    alignment: 0,
    phase: 'unknown',
    angles: [],
    repAngle: null,
    handDistanceRatio: null,
    perfect: false,
    visibleBody: false,
    flags: [],
    aux: { secondaryDown: null },
  };
}

function build(checks, levels, stage, flags, extra, angles, repAngle, secondaryDown) {
  const alignment = levels.length
    ? Math.round((levels.reduce((a, l) => a + levelQuality[l], 0) / levels.length) * 100)
    : 0;
  const cues = [
    ...extra,
    ...flags
      .map((f) => FLAG_CUES[f])
      .filter(Boolean)
      .map((c) => ({ dir: c.dir, text: c.text })),
  ];
  return {
    checks,
    adjustments: cues.slice(0, 3),
    alignment,
    phase: STAGE_PHASE[stage],
    angles,
    repAngle,
    handDistanceRatio: null,
    perfect: alignment >= 88 && flags.length === 0,
    visibleBody: levels.length >= 1,
    flags,
    aux: { secondaryDown },
  };
}

function check(id, label, value, v) {
  const level = typeof v === 'string' ? v : v.level;
  return { id, label, value, status: level };
}

/* ------------------------------------------------------------------ */
/* SQUAT                                                               */
/* ------------------------------------------------------------------ */

export class SquatAnalyzer {
  lastRepFlags = [];
  stage = 'standing';
  facing = null;
  smoothK = null;
  minK = 999;
  flags = new FlagTracker(4);
  trail = new Trail();
  deepFrames = 0;

  reset() {
    this.stage = 'standing';
    this.smoothK = null;
    this.minK = 999;
    this.flags.clear();
    this.trail.clear();
    this.lastRepFlags = [];
  }

  analyze(kps, t) {
    const f = squatFeatures(kps, this.facing);
    if (!f) return empty();
    this.facing = f.facing;

    this.smoothK = this.smoothK === null ? f.kneeDeg : this.smoothK + 0.5 * (f.kneeDeg - this.smoothK);
    const k = this.smoothK;
    this.trail.push(t, f.hip.y, f.shoulder.y);

    this.step(k);

    const checks = [];
    const levels = [];
    const extra = [];
    const R = SQUAT_RULES;

    const kneeVerdict = classifyKnee(this.minK < 999 && this.stage === 'bottom' ? this.minK : k);
    const judgeKnee = this.stage === 'bottom';
    checks.push(check('knees', 'KNEES', deg(k), judgeKnee ? kneeVerdict : 'good'));
    levels.push(judgeKnee ? kneeVerdict.level : 'good');
    if (this.stage === 'bottom') this.flags.hit('Too Deep', this.minK < R.knee.tooDeepBelow);

    const deep = k <= 110;
    if (deep) {
      this.deepFrames++;
      const trunk = classifyTrunk(f.trunkAngle);
      const hinge = classifyHinge(f.hingeDeg);
      const tibia = classifyTrunkTibia(f.trunkTibiaDiff);
      const travel = classifyKneeTravel(f.kneeTravel);
      checks.push(check('trunk', 'BACK', deg(f.trunkAngle), trunk));
      checks.push(check('hinge', 'HIP HINGE', deg(f.hingeDeg), hinge));
      checks.push(check('shins', 'SHIN/TORSO', deg(f.trunkTibiaDiff), tibia));
      checks.push(check('travel', 'KNEE TRAVEL', `${Math.round(Math.max(0, f.kneeTravel) * 100)}%`, travel));
      levels.push(trunk.level, hinge.level, tibia.level, travel.level);
      for (const v of [trunk, hinge, tibia, travel]) if (v.flag) this.flags.hit(v.flag, true);
      for (const name of [
        'Good Morning Error',
        'Spinal Hyper-extension',
        'Hip Collapse',
        'Excessive Forward Lean',
        'Knees Too Far Forward',
      ]) {
        if (![trunk, hinge, tibia, travel].some((v) => v.flag === name)) this.flags.hit(name, false);
      }
      if (f.spine) {
        const sp = classifySpine(f.spine);
        checks.push(check('spine', f.spine.approx ? 'BACK CURVE~' : 'SPINE', deg(f.spine.dev), sp));
        levels.push(sp.level);
        const name = f.spine.approx ? 'Rounded Back' : 'Butt Wink';
        this.flags.hit(name, !!sp.flag);
      }
    }

    if (this.stage === 'ascending') {
      const r = this.trail.rise();
      const torso = Math.max(1, dist(f.shoulder, f.hip));
      if (r && r.sh > 0.04 * torso) {
        const ratio = r.hip / r.sh;
        this.flags.hit('Rushed Ascent', ratio > R.ascentRatioMax);
      }
    }

    if (isFrontal(kps)) extra.push({ dir: 'hold', text: 'Turn sideways to camera' });

    return build(
      checks,
      levels,
      this.stage,
      this.flags.list(),
      extra,
      [{ name: 'KNEES', deg: k, at: f.knee }],
      f.kneeDeg,
      f.hipLevel
    );
  }

  step(k) {
    const R = SQUAT_RULES;
    switch (this.stage) {
      case 'standing':
        if (k >= R.standingKnee) {
          this.flags.clear();
          this.minK = 999;
          this.deepFrames = 0;
        } else if (k < R.leaveStandingKnee) {
          this.stage = 'descending';
          this.minK = k;
        }
        break;
      case 'descending':
        this.minK = Math.min(this.minK, k);
        if (k <= R.bottomKnee) this.stage = 'bottom';
        else if (k >= R.standingKnee) this.finishRep();
        break;
      case 'bottom':
        this.minK = Math.min(this.minK, k);
        if (k > R.bottomKnee + 6 && k - this.minK > 8) this.stage = 'ascending';
        break;
      case 'ascending':
        this.minK = Math.min(this.minK, k);
        if (k >= R.standingKnee) this.finishRep();
        else if (k <= R.bottomKnee) this.stage = 'bottom';
        break;
    }
  }

  finishRep() {
    this.lastRepFlags = this.flags.list();
    this.stage = 'standing';
    this.flags.clear();
    this.trail.clear();
    this.minK = 999;
  }
}

/* ------------------------------------------------------------------ */
/* PUSH-UP                                                             */
/* ------------------------------------------------------------------ */

export class PushupAnalyzer {
  lastRepFlags = [];
  stage = 'standing';
  smoothE = null;
  minE = 999;
  flags = new FlagTracker(4);
  trail = new Trail();

  reset() {
    this.stage = 'standing';
    this.smoothE = null;
    this.minE = 999;
    this.flags.clear();
    this.trail.clear();
    this.lastRepFlags = [];
  }

  analyze(kps, t) {
    const f = pushupFeatures(kps);
    if (!f) return empty();

    this.smoothE = this.smoothE === null ? f.elbowDeg : this.smoothE + 0.5 * (f.elbowDeg - this.smoothE);
    const e = this.smoothE;
    this.trail.push(t, f.hip.y, f.shoulder.y);
    this.step(e);

    const R = PUSHUP_RULES;
    const frontal = isFrontal(kps);
    const checks = [];
    const levels = [];
    const extra = [];

    const bottom = this.stage === 'bottom';
    const elbowV = classifyElbowBottom(bottom ? this.minE : Math.min(e, 90));
    checks.push(check('elbows', 'ELBOWS', deg(e), bottom ? elbowV : 'good'));
    levels.push(bottom ? elbowV.level : 'good');

    const hipV = classifyHipAlignment(f.hipDeg);
    const plankV = classifyPlank(f.plankDev);
    checks.push(check('hips', 'HIPS', deg(f.hipDeg), hipV));
    checks.push(check('plank', 'BODY LINE', deg(f.plankDev), plankV));
    levels.push(hipV.level, plankV.level);

    const instant = [];
    const judge = (v, names) => {
      for (const n of names) {
        const active = v.flag === n;
        if (this.stage === 'standing') {
          if (active) instant.push(n);
        } else {
          this.flags.hit(n, active);
        }
      }
    };
    judge(hipV, ['Sagging Hips', 'Hiked Hips']);
    judge(plankV, ['Broken Plank']);

    if (f.neckDev !== null) {
      const neckV = classifyNeck(f.neckDev);
      checks.push(check('neck', 'NECK', deg(f.neckDev), neckV));
      levels.push(neckV.level);
      judge(neckV, ['Head Dropping']);
    }

    if (frontal && bottom) {
      const ab = classifyAbduction(f.abductionDeg ?? 0);
      checks.push(check('flare', 'ELBOW FLARE', deg(f.abductionDeg ?? 0), ab));
      levels.push(ab.level);
      this.flags.hit('Elbow Flaring', ab.flag === 'Elbow Flaring');
    }

    if (this.stage === 'ascending') {
      const r = this.trail.rise();
      const scale = Math.max(1, dist(f.shoulder, f.ankle));
      if (r && r.sh > 0.03 * scale) {
        const expected = dist(f.hip, f.ankle) / scale;
        const ratio = r.hip / r.sh;
        const [lo, hi] = R.riseRatioTol;
        this.flags.hit('Uneven Rise', ratio > expected * hi || ratio < expected * lo);
      }
    }

    if (frontal) extra.push({ dir: 'hold', text: 'Turn sideways to camera' });

    const flags = [...new Set([...this.flags.list(), ...instant])];
    return build(
      checks,
      levels,
      this.stage,
      flags,
      extra,
      [{ name: 'ELBOWS', deg: e, at: f.elbow }],
      f.elbowDeg,
      f.chestDown
    );
  }

  step(e) {
    const R = PUSHUP_RULES;
    switch (this.stage) {
      case 'standing':
        if (e >= R.standingElbow) {
          this.flags.clear();
          this.minE = 999;
        } else if (e < R.leaveStandingElbow) {
          this.stage = 'descending';
          this.minE = e;
        }
        break;
      case 'descending':
        this.minE = Math.min(this.minE, e);
        if (e <= R.bottomElbow) this.stage = 'bottom';
        else if (e >= R.standingElbow) this.finishRep();
        break;
      case 'bottom':
        this.minE = Math.min(this.minE, e);
        if (e > R.bottomElbow + 6 && e - this.minE > 8) this.stage = 'ascending';
        break;
      case 'ascending':
        this.minE = Math.min(this.minE, e);
        if (e >= R.standingElbow) this.finishRep();
        else if (e <= R.bottomElbow) this.stage = 'bottom';
        break;
    }
  }

  finishRep() {
    this.lastRepFlags = this.flags.list();
    this.stage = 'standing';
    this.flags.clear();
    this.trail.clear();
    this.minE = 999;
  }
}