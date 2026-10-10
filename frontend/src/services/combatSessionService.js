/**
 * combatSessionService.js
 * Phase 1 combat engine. Uses the 50-byte APEX packet's impact_count delta.
 * v10.1 (56-byte) combat fields auto-populate when available.
 */
import { getAthloniaBandService } from './athloniaBandService';

const DEFAULT_CONFIG = {
  discipline: 'boxing',
  roundsPlanned: 3,
  roundDurationSec: 180,
  restDurationSec: 60,
};

const TICK_INTERVAL_MS = 1000;
const STALE_PACKET_MS = 3000;

export class CombatSessionService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = 'idle';
    this.round = 0;
    this.startedAt = null;
    this.roundStartedAt = null;
    this.rounds = [];
    this._currentRound = null;
    this.hrTimeline = [];
    this.impactTimeline = [];
    this.strikeTypeDistribution = { straight: 0, hook: 0, uppercut: 0, block: 0 };
    this._baselineImpact = null;
    this._lastImpactCount = null;
    this._lastHRPushTs = 0;
    this._lastPacketTs = 0;
    this._listeners = new Set();
    this._tickTimer = null;
    this._roundTimer = null;
    this._unsubBand = null;
    this._destroyed = false;
    this._restStartHR = 0;
  }

  start() {
    if (this.state !== 'idle') return false;
    const band = getAthloniaBandService();
    if (!band || !band.connected || typeof band.subscribe !== 'function') {
      this._emit('error', { message: 'Band not connected' });
      return false;
    }
    const now = Date.now();
    this.startedAt = now;
    this.round = 0;
    this.rounds = [];
    this.hrTimeline = [];
    this.impactTimeline = [];
    this._baselineImpact = null;
    this._lastImpactCount = null;
    this._lastHRPushTs = 0;
    this._lastPacketTs = 0;
    this._unsubBand = band.subscribe((packet) => {
      if (this._destroyed) return;
      this._onPacket(packet);
    });
    this._tickTimer = setInterval(() => this._tick(), TICK_INTERVAL_MS);
    this._startFightRound();
    this._emit('state', { state: this.state, round: this.round });
    return true;
  }

  end() {
    if (this.state === 'idle') return null;
    this._finalizeCurrentRound();
    this._stopTimers();
    if (this._unsubBand) { try { this._unsubBand(); } catch {} this._unsubBand = null; }
    this.state = 'done';
    this._emit('state', { state: this.state, round: this.round });
    const payload = this._buildPayload();
    this._emit('session_end', payload);
    return payload;
  }

  subscribe(fn) {
    if (typeof fn !== 'function') return () => {};
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  getSnapshot() {
    const now = Date.now();
    const elapsed = this.startedAt ? Math.floor((now - this.startedAt) / 1000) : 0;
    const roundElapsed = this.roundStartedAt ? Math.floor((now - this.roundStartedAt) / 1000) : 0;
    const lastHR = this.hrTimeline.length ? this.hrTimeline[this.hrTimeline.length - 1].hr : 0;
    const strikesThisRound = this._currentRound ? this._currentRound.strikes : 0;
    const roundDuration = this.state === 'resting' ? this.config.restDurationSec : this.config.roundDurationSec;
    const roundRemaining = Math.max(0, roundDuration - roundElapsed);
    const stale = this._lastPacketTs > 0 && (now - this._lastPacketTs) > STALE_PACKET_MS;
    return {
      state: this.state, round: this.round, roundsPlanned: this.config.roundsPlanned,
      discipline: this.config.discipline, elapsed, roundElapsed, roundRemaining,
      strikesThisRound, totalStrikes: this._totalStrikes(), lastHR, stale,
      peakImpact: this._peakImpact(),
    };
  }

  destroy() {
    this._destroyed = true;
    this._stopTimers();
    if (this._unsubBand) { try { this._unsubBand(); } catch {} this._unsubBand = null; }
    this._listeners.clear();
    this.state = 'done';
  }

  _onPacket(p) {
    const now = Date.now();
    this._lastPacketTs = now;

    if (this._baselineImpact === null) {
      this._baselineImpact = Number(p.impact_count) || 0;
      this._lastImpactCount = this._baselineImpact;
    }
    this._bufferHR(p, now);

    let delta = 0;
    if (p.combat && typeof p.combat.strikesThisSec === 'number') {
      delta = p.combat.strikesThisSec;
      if (p.combat.strikeTypes) {
        if (p.combat.strikeTypes.straight) this.strikeTypeDistribution.straight++;
        if (p.combat.strikeTypes.hook)     this.strikeTypeDistribution.hook++;
        if (p.combat.strikeTypes.uppercut) this.strikeTypeDistribution.uppercut++;
        if (p.combat.strikeTypes.block)    this.strikeTypeDistribution.block++;
      }
    } else {
      const currentImpact = Number(p.impact_count) || 0;
      if (this._lastImpactCount !== null && currentImpact > this._lastImpactCount) {
        const rawDelta = currentImpact - this._lastImpactCount;
        if (rawDelta > 0 && rawDelta < 50) delta = rawDelta;
      }
      this._lastImpactCount = Number(p.impact_count) || 0;
    }

    if (delta > 0) this._recordStrikes(delta, p, now);
  }

  _bufferHR(p, now) {
    if (!p.hr_valid || !p.heart_rate || p.heart_rate <= 0) return;
    if (now - this._lastHRPushTs < 900) return;
    const t = Math.floor((now - this.startedAt) / 1000);
    this.hrTimeline.push({ t, hr: Math.round(p.heart_rate) });
    this._lastHRPushTs = now;
    if (this._currentRound) {
      const r = this._currentRound;
      r._hrSum += p.heart_rate;
      r._hrCount += 1;
      if (p.heart_rate > r.hrMax) r.hrMax = p.heart_rate;
      r.hrEnd = Math.round(p.heart_rate);
    }
  }

  _recordStrikes(delta, p, now) {
    const t = Math.round((now - this.startedAt) / 100) / 10;
    const cumMax = Number(p.hardest_impact) || 0;
    this.impactTimeline.push({ t, delta, cumMax: Math.round(cumMax * 100) / 100 });
    if (this._currentRound) {
      this._currentRound.strikes += delta;
      if (p.intensity != null) {
        this._currentRound._intensitySum += p.intensity;
        this._currentRound._intensityCount += 1;
      }
    }
    this._emit('strike', { t, delta });
  }

  _startFightRound() {
    this.round += 1;
    this.state = 'fighting';
    this.roundStartedAt = Date.now();
    this._currentRound = this._newRoundAccumulator(this.round);
    this._emit('state', { state: this.state, round: this.round });
    this._roundTimer = setTimeout(() => {
      if (this._destroyed) return;
      this._endFightRound();
    }, this.config.roundDurationSec * 1000);
  }

  _endFightRound() {
    this._finalizeCurrentRound();
    if (this.round >= this.config.roundsPlanned) {
      this.state = 'done';
      this._emit('state', { state: this.state, round: this.round });
      this._stopTimers();
      this._emit('session_end', this._buildPayload());
      return;
    }
    this._startRestRound();
  }

  _startRestRound() {
    this.state = 'resting';
    this.roundStartedAt = Date.now();
    this._currentRound = null;
    this._restStartHR = this.hrTimeline.length ? this.hrTimeline[this.hrTimeline.length - 1].hr : 0;
    this._emit('state', { state: this.state, round: this.round });
    this._roundTimer = setTimeout(() => {
      if (this._destroyed) return;
      this._endRestRound();
    }, this.config.restDurationSec * 1000);
  }

  _endRestRound() {
    if (this.rounds.length) {
      const last = this.rounds[this.rounds.length - 1];
      const restStart = this._restStartHR || last.hrEnd || 0;
      const restEnd = this.hrTimeline.length ? this.hrTimeline[this.hrTimeline.length - 1].hr : restStart;
      last.recoveryDrop = Math.max(0, restStart - restEnd);
    }
    this._startFightRound();
  }

  _newRoundAccumulator(roundNum) {
    return {
      round: roundNum, strikes: 0, strikeRate: 0,
      avgImpact: null, maxImpact: 0, intensityAvg: 0,
      hrAvg: 0, hrMax: 0, hrEnd: 0, recoveryDrop: null,
      _hrSum: 0, _hrCount: 0, _intensitySum: 0, _intensityCount: 0,
      _startedAt: Date.now(),
    };
  }

  _finalizeCurrentRound() {
    if (!this._currentRound) return;
    const r = this._currentRound;
    const durationSec = Math.max(1, Math.floor((Date.now() - r._startedAt) / 1000));
    const summary = {
      round: r.round,
      strikes: r.strikes,
      strikeRate: Math.round((r.strikes / durationSec) * 60),
      avgImpact: null,
      maxImpact: Math.round(this._peakImpact() * 100) / 100,
      intensityAvg: r._intensityCount ? Math.round(r._intensitySum / r._intensityCount) : 0,
      hrAvg: r._hrCount ? Math.round(r._hrSum / r._hrCount) : 0,
      hrMax: Math.round(r.hrMax || 0),
      hrEnd: Math.round(r.hrEnd || 0),
      recoveryDrop: null,
    };
    this.rounds.push(summary);
    this._emit('round_end', summary);
    this._currentRound = null;
  }

  _tick() {
    if (this._destroyed) return;
    this._emit('tick', this.getSnapshot());
  }

  _stopTimers() {
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
    if (this._roundTimer) { clearTimeout(this._roundTimer); this._roundTimer = null; }
  }

  _emit(event, data) {
    this._listeners.forEach((fn) => {
      try { fn(event, data); } catch (err) { console.warn('combat listener error:', err); }
    });
  }

  _totalStrikes() {
    const fromRounds = this.rounds.reduce((s, r) => s + (r.strikes || 0), 0);
    const live = this._currentRound ? this._currentRound.strikes : 0;
    return fromRounds + live;
  }

  _peakImpact() {
    let max = 0;
    for (const p of this.impactTimeline) if (p.cumMax > max) max = p.cumMax;
    return max;
  }

  _computeTotals() {
    const strikes = this.rounds.reduce((s, r) => s + (r.strikes || 0), 0);
    const totalSec = this.startedAt ? Math.floor((Date.now() - this.startedAt) / 1000) : 0;
    const avgStrikeRate = totalSec > 0 ? Math.round((strikes / totalSec) * 60) : 0;
    const hardestImpact = this._peakImpact();
    const impactComponent = Math.min(100, (hardestImpact / 15) * 100);
    const rateComponent = Math.min(100, (avgStrikeRate / 60) * 100);
    const intensityAvg = this.rounds.length
      ? this.rounds.reduce((s, r) => s + (r.intensityAvg || 0), 0) / this.rounds.length : 0;
    const powerScore = Math.round(0.45 * impactComponent + 0.35 * rateComponent + 0.20 * intensityAvg);

    let enduranceScore = 0;
    if (this.rounds.length >= 2) {
      const first = this.rounds[0].strikeRate || 1;
      const last = this.rounds[this.rounds.length - 1].strikeRate || 0;
      const ratio = Math.max(0, Math.min(1.2, last / first));
      enduranceScore = Math.round(Math.min(100, ratio * 100));
    } else if (this.rounds.length === 1) enduranceScore = 60;

    const drops = this.rounds.map((r) => r.recoveryDrop).filter((d) => typeof d === 'number' && d > 0);
    let conditioningIndex = 0;
    if (drops.length) {
      const avgDrop = drops.reduce((s, d) => s + d, 0) / drops.length;
      conditioningIndex = Math.round(Math.min(100, 30 + (avgDrop / 30) * 70));
    } else conditioningIndex = 50;

    return {
      strikes, hardestImpact: Math.round(hardestImpact * 100) / 100,
      avgStrikeRate, powerScore, enduranceScore, conditioningIndex,
    };
  }

  _buildPayload() {
    return {
      source: 'combat',
      discipline: this.config.discipline,
      roundsPlanned: this.config.roundsPlanned,
      roundDurationSec: this.config.roundDurationSec,
      restDurationSec: this.config.restDurationSec,
      rounds: this.rounds.map((r) => ({ ...r })),
      totals: this._computeTotals(),
      strikeTypeDistribution: { ...this.strikeTypeDistribution },
      hrTimeline: this.hrTimeline.slice(),
      impactTimeline: this.impactTimeline.slice(),
      startedAt: this.startedAt,
      endedAt: Date.now(),
    };
  }
}

export function createCombatSession(config) {
  return new CombatSessionService(config);
}

export default CombatSessionService;