/**
 * Robust rep counter driven by ONE joint angle (elbow for push-ups, knee for squats).
 * Ported from AR Fit (TS to JS).
 */

export const PUSHUP_CFG = {
  upAngle: 160,
  downAngle: 100,
  leaveMargin: 10,
  minRepMs: 700,
  maxRepMs: 12000,
  bottomDwellMs: 80,
  lostMs: 800,
  emaAlpha: 0.45,
  maxJumpDeg: 55,
};

export const SQUAT_CFG = {
  upAngle: 160,
  downAngle: 100,
  leaveMargin: 10,
  minRepMs: 900,
  maxRepMs: 12000,
  bottomDwellMs: 80,
  lostMs: 800,
  emaAlpha: 0.45,
  maxJumpDeg: 55,
};

// Coaching signal configurations for the added exercises (from ARFit v6).
// Values are 2-D MoveNet heuristics; camera angle and individual range of motion affect results.
export const BURPEE_CFG = {
  upAngle: 160,
  downAngle: 100,
  leaveMargin: 10,
  minRepMs: 1200,
  maxRepMs: 18000,
  bottomDwellMs: 70,
  lostMs: 1000,
  emaAlpha: 0.4,
  maxJumpDeg: 60,
};

export const SITUP_CFG = {
  upAngle: 150,
  downAngle: 105,
  leaveMargin: 10,
  minRepMs: 900,
  maxRepMs: 15000,
  bottomDwellMs: 80,
  lostMs: 900,
  emaAlpha: 0.45,
  maxJumpDeg: 60,
};

export const JUMPING_JACK_CFG = {
  upAngle: 155,
  downAngle: 80,
  leaveMargin: 10,
  minRepMs: 450,
  maxRepMs: 8000,
  bottomDwellMs: 50,
  lostMs: 700,
  emaAlpha: 0.5,
  maxJumpDeg: 65,
};

// Unused by RepCounter for plank; reserved for a future hold-mode feature.
export const PLANK_CFG = {
  upAngle: 170,
  downAngle: 160,
  leaveMargin: 5,
  minRepMs: 1000,
  maxRepMs: 60000,
  bottomDwellMs: 50,
  lostMs: 1500,
  emaAlpha: 0.4,
  maxJumpDeg: 35,
};

export class RepCounter {
  constructor(cfg) {
    this.cfg = cfg;
    this.reps = 0;
    this.state = 'waiting';
    this.smooth = null;
    this.jumpStreak = 0;
    this.startT = 0;
    this.minAngle = 999;
    this.bottomSince = null;
    this.bottomReached = false;
    this.lostSince = null;
    this.lastMin = null;
    this.secondarySeen = false;
    this.secondaryGiven = false;
    this.prevSmooth = null;
    this.rising = false;
  }

  reset() {
    this.reps = 0;
    this.state = 'waiting';
    this.smooth = null;
    this.jumpStreak = 0;
    this.bottomReached = false;
    this.bottomSince = null;
    this.lostSince = null;
    this.secondarySeen = false;
    this.secondaryGiven = false;
    this.prevSmooth = null;
    this.rising = false;
  }

  update(angle, t, ctx) {
    const c = this.cfg;
    let event = null;
    let secondaryOk = null;

    if (angle === null) {
      if (this.lostSince === null) this.lostSince = t;
      if (t - this.lostSince > c.lostMs) {
        this.state = 'waiting';
        this.smooth = null;
        this.bottomReached = false;
        this.bottomSince = null;
      }
      return this.snapshot(event, null);
    }
    this.lostSince = null;

    if (this.smooth === null) {
      this.smooth = angle;
      this.jumpStreak = 0;
    } else {
      if (Math.abs(angle - this.smooth) > c.maxJumpDeg && this.jumpStreak < 2) {
        this.jumpStreak++;
      } else {
        this.jumpStreak = 0;
        this.smooth = this.smooth + c.emaAlpha * (angle - this.smooth);
      }
    }
    const a = this.smooth;

    if (this.prevSmooth !== null) {
      if (a - this.prevSmooth > 0.6) this.rising = true;
      else if (this.prevSmooth - a > 0.6) this.rising = false;
    }
    this.prevSmooth = a;

    if (ctx && ctx.secondaryDown !== undefined && ctx.secondaryDown !== null) {
      this.secondaryGiven = true;
      if (this.state === 'descending' && ctx.secondaryDown) this.secondarySeen = true;
    }

    switch (this.state) {
      case 'waiting':
        if (a >= c.upAngle) this.state = 'up';
        break;

      case 'up':
        if (a < c.upAngle - c.leaveMargin) {
          this.state = 'descending';
          this.startT = t;
          this.minAngle = a;
          this.bottomReached = false;
          this.bottomSince = null;
          this.secondarySeen = false;
          this.secondaryGiven = !!(ctx && ctx.secondaryDown !== undefined && ctx.secondaryDown !== null);
          if (this.secondaryGiven && ctx.secondaryDown) this.secondarySeen = true;
        }
        break;

      case 'descending': {
        if (a < this.minAngle) this.minAngle = a;
        if (a <= c.downAngle) {
          if (this.bottomSince === null) this.bottomSince = t;
          if (t - this.bottomSince >= c.bottomDwellMs) this.bottomReached = true;
        } else {
          this.bottomSince = null;
        }
        if (t - this.startT > c.maxRepMs) {
          this.state = 'waiting';
          break;
        }
        if (a >= c.upAngle) {
          const dur = t - this.startT;
          this.lastMin = this.minAngle;
          secondaryOk = this.secondaryGiven ? this.secondarySeen : null;
          if (this.bottomReached && dur >= c.minRepMs) {
            this.reps++;
            event = 'rep';
          } else if (this.minAngle < c.upAngle - 25) {
            event = 'partial';
          }
          this.state = 'up';
          this.bottomReached = false;
          this.bottomSince = null;
        }
        break;
      }
    }
    return this.snapshot(event, secondaryOk);
  }

  snapshot(event, secondaryOk) {
    const c = this.cfg;
    let phase = 'waiting';
    let stage = 'waiting';
    const a = this.smooth;
    if (this.state === 'up') {
      phase = 'up';
      stage = 'standing';
    } else if (this.state === 'descending') {
      const atBottom = a !== null && a <= c.downAngle;
      phase = atBottom ? 'down' : 'transition';
      stage = atBottom ? 'bottom' : (this.bottomReached || this.rising) ? 'ascending' : 'descending';
    }
    return {
      reps: this.reps,
      phase,
      smoothed: a,
      event,
      lastMinAngle: this.lastMin,
      stage,
      secondaryOk,
    };
  }
}