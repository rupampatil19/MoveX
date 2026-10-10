/**
 * APEX Fitness Band service (formerly "AthloniaBandService").
 * Web Bluetooth client for the APEX band: XIAO ESP32-S3 + ICM-20948 IMU + MAX30102 PPG.
 *
 * Dual-format support on the same service + notify characteristic:
 *   - 12-byte legacy Athlonia packets (old firmware)
 *   - 50-byte APEX packets (current firmware)
 *
 * The dispatch is by byteLength in _handleNotification. Public API and
 * export names are unchanged from the Athlonia version so existing
 * consumers (useAthloniaBand, AthloniaBandWidget, Phase 3 capture)
 * keep working without edits.
 *
 * Field naming convention on the decoded object:
 *   - Legacy-compatible keys (heart_rate, hr_valid, quality, steps,
 *     cadence, battery, sequence, raw_heart_rate, version) are preserved.
 *   - New APEX fields are appended in snake_case.
 */

const DEVICE_FILTERS = [
  { name: 'APEX Fitness Band' },
  { name: 'Athlonia_Band' },
  { namePrefix: 'APEX' },
  { namePrefix: 'Athlonia' },
];

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const NOTIFY_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

const HEADER_BYTE = 0xAA;
const PACKET_LENGTH_LEGACY = 12;
const PACKET_LENGTH_APEX = 50;
const PACKET_LENGTH_V101 = 56;

// MoveX-style activity strings (lowercase snake_case)
const ACTIVITY_NAMES = ['resting', 'candidate', 'walking', 'running', 'combat_striking', 'combat_guard'];
const COMBAT_MODE_NAMES = ['boxing', 'mma', 'muaythai'];

export class AthloniaBandService {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.connected = false;
    this.packets = [];
    this.MAX_BUFFER = 600;
    this.onPacket = null;
    this.onDisconnect = null;
    this.onConnect = null;
    this._subscribers = new Set();
    this._handleNotification = this._handleNotification.bind(this);
    this._handleDisconnect = this._handleDisconnect.bind(this);
  }

  static isSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect() {
    if (!AthloniaBandService.isSupported()) {
      throw new Error('Web Bluetooth is not supported on this device/browser.');
    }
    this.device = await navigator.bluetooth.requestDevice({
      filters: DEVICE_FILTERS,
      optionalServices: [SERVICE_UUID],
    });
    this.device.addEventListener('gattserverdisconnected', this._handleDisconnect);
    this.server = await this.device.gatt.connect();
    const service = await this.server.getPrimaryService(SERVICE_UUID);
    this.characteristic = await service.getCharacteristic(NOTIFY_CHAR_UUID);
    await this.characteristic.startNotifications();
    this.characteristic.addEventListener(
      'characteristicvaluechanged',
      this._handleNotification
    );
    this.connected = true;
    this.onConnect?.({
      deviceName: this.device.name || 'APEX Fitness Band',
      deviceId: this.device.id,
    });
    return { deviceName: this.device.name, deviceId: this.device.id };
  }

  disconnect() {
    try {
      if (this.characteristic) {
        this.characteristic.removeEventListener(
          'characteristicvaluechanged',
          this._handleNotification
        );
        this.characteristic.stopNotifications().catch(() => {});
      }
    } catch {}
    try {
      if (this.device && this.device.gatt && this.device.gatt.connected) {
        this.device.gatt.disconnect();
      }
    } catch {}
    this._reset();
  }

  subscribe(fn) {
    if (typeof fn !== 'function') return () => {};
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }

  /**
   * v10.1: send a single-character sport mode command on the Text characteristic.
   * Requires the firmware to expose the Text characteristic as writable.
   * Boxing = 'B', MMA = 'M', Muay Thai = 'T'.
   * Fire-and-forget: no BLE ack.
   */
  async setSportMode(sport) {
    const map = { boxing: 'B', mma: 'M', muaythai: 'T' };
    const cmd = map[String(sport).toLowerCase()];
    if (!cmd) throw new Error('Unknown sport: ' + sport);
    if (!this.server || !this.connected) throw new Error('Band not connected');
    try {
      const TXT_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';
      const svc = await this.server.getPrimaryService(SERVICE_UUID);
      const char = await svc.getCharacteristic(TXT_UUID);
      const buf = new TextEncoder().encode(cmd);
      await char.writeValue(buf);
      return true;
    } catch (err) {
      console.warn('[band] setSportMode failed:', err.message);
      return false;
    }
  }

  getPackets() { return this.packets.slice(); }
  getLatest() { return this.packets.length ? this.packets[this.packets.length - 1] : null; }
  resetBuffer() { this.packets = []; }

  getAverageHR(seconds = 30) {
    const cutoff = Date.now() - seconds * 1000;
    const recent = this.packets.filter(
      (p) => p.timestamp >= cutoff && p.hr_valid && p.heart_rate > 0
    );
    if (!recent.length) return 0;
    return Math.round(recent.reduce((s, p) => s + p.heart_rate, 0) / recent.length);
  }

  getMaxHR(seconds = 60) {
    const cutoff = Date.now() - seconds * 1000;
    const recent = this.packets.filter(
      (p) => p.timestamp >= cutoff && p.hr_valid && p.heart_rate > 0
    );
    if (!recent.length) return 0;
    return Math.max(...recent.map((p) => p.heart_rate));
  }

  _reset() {
    this.connected = false;
    this.characteristic = null;
    this.server = null;
    this.device = null;
  }

  _handleDisconnect() {
    this.connected = false;
    this.onDisconnect?.();
  }

  _handleNotification(event) {
    const dv = event.target.value;
    const len = dv.byteLength;
    const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);

    let decoded = null;
    if (len === PACKET_LENGTH_V101 || len === PACKET_LENGTH_APEX) {
      decoded = AthloniaBandService.decodeApexPacket(bytes);
    } else if (len === PACKET_LENGTH_LEGACY) {
      decoded = AthloniaBandService.decodeAthloniaPacket(bytes);
    }
    if (!decoded) return;

    decoded.timestamp = Date.now();
    this.packets.push(decoded);
    if (this.packets.length > this.MAX_BUFFER) {
      this.packets.splice(0, this.packets.length - this.MAX_BUFFER);
    }
    this.onPacket?.(decoded);
    this._subscribers.forEach((fn) => {
      try { fn(decoded); } catch {}
    });
  }

  // ----------------------------------------------------------
  // APEX 50-byte decoder (primary)
  // ----------------------------------------------------------
  static decodeApexPacket(bytes) {
    if (!bytes || bytes.length < PACKET_LENGTH_APEX) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint8(0) !== HEADER_BYTE) return null;

    const version = view.getUint8(1);
    const sequence = view.getUint8(3);

    const rawHR = view.getUint8(4);
    const qualByte = view.getUint8(5);
    const hrValid = (qualByte & 0x80) > 0;
    const heart_rate = hrValid ? rawHR : 0;
    const quality = qualByte & 0x7F;

    const steps = view.getUint32(6, true);
    const cadence = view.getUint8(10);
    const activityState = view.getUint8(11);

    const calories = view.getUint16(12, true);
    const distanceM = view.getUint16(14, true);
    const speedKmh = view.getUint16(16, true) / 10;
    const intensity = view.getUint8(18);
    const trainingLoad = view.getUint16(19, true) / 10;

    const rmssd = view.getUint16(21, true);
    const sdnn = view.getUint16(23, true);

    const sessionTime = view.getUint32(25, true);
    const activeTime = view.getUint32(29, true);
    const restTime = view.getUint32(33, true);

    const stillness = view.getUint8(37);
    const evenness = view.getUint8(38);
    const bodyControl = view.getUint8(39);
    const impactCount = view.getUint16(40, true);
    const hardestImpact = view.getUint16(42, true) / 100;

    const battery = view.getUint8(44);
    const sensorStatus = view.getUint8(45);
    const ppgOk = (sensorStatus & 0x01) > 0;
    const imuOk = (sensorStatus & 0x02) > 0;

    // === v10.1 combat fields (bytes 50-55, present only in 56-byte packets) ===
    let combat = null;
    if (view.byteLength >= PACKET_LENGTH_V101) {
      const strikesThisSec    = view.getUint16(50, true);
      const peakForceThisSec  = view.getUint16(52, true) / 100;
      const combatMode        = view.getUint8(54);
      const strikeTypeFlags   = view.getUint8(55);
      combat = {
        strikesThisSec,
        peakForceThisSec,
        combatMode,
        combatModeName: COMBAT_MODE_NAMES[combatMode] || 'boxing',
        strikeTypeFlags,
        strikeTypes: {
          straight: !!(strikeTypeFlags & 0x01),
          hook:     !!(strikeTypeFlags & 0x02),
          uppercut: !!(strikeTypeFlags & 0x04),
          block:    !!(strikeTypeFlags & 0x08),
        },
      };
    }

    return {
      sequence, version,
      heart_rate, raw_heart_rate: rawHR, hr_valid: hrValid, quality,
      steps, cadence, battery,
      activity_state: activityState,
      activity_name: ACTIVITY_NAMES[activityState] || 'unknown',
      is_combat: activityState === 4 || activityState === 5,
      calories,
      distance_m: distanceM,
      speed_kmh: speedKmh,
      intensity,
      training_load: trainingLoad,
      rmssd, sdnn,
      session_time: sessionTime,
      active_time: activeTime,
      rest_time: restTime,
      stillness,
      evenness,
      body_control: bodyControl,
      impact_count: impactCount,
      hardest_impact: hardestImpact,
      ppg_ok: ppgOk,
      imu_ok: imuOk,
      packet_size: view.byteLength,
      combat,
    };
  }

  // ----------------------------------------------------------
  // Legacy 12-byte Athlonia decoder (fallback for old firmware)
  // ----------------------------------------------------------
  static decodeAthloniaPacket(bytes) {
    if (!bytes || bytes.length !== PACKET_LENGTH_LEGACY) return null;
    if (bytes[0] !== HEADER_BYTE) return null;

    const sequence = bytes[3];
    const rawHr = bytes[4];
    const steps = bytes[5] | (bytes[6] << 8);
    const cadence = bytes[7];
    const qualityByte = bytes[8];
    const battery = bytes[9];
    const quality = qualityByte & 0x7F;
    const hrValid = (qualityByte & 0x80) > 0;

    return {
      sequence,
      version: bytes[1],
      heart_rate: hrValid ? rawHr : 0,
      raw_heart_rate: rawHr,
      steps,
      cadence,
      quality,
      hr_valid: hrValid,
      battery,
      activity_state: 0,
      activity_name: 'resting',
      packet_size: PACKET_LENGTH_LEGACY,
    };
  }

  // Auto-dispatch decoder (length-based)
  static decodePacket(bytes) {
    if (!bytes) return null;
    if (bytes.length === PACKET_LENGTH_APEX) return AthloniaBandService.decodeApexPacket(bytes);
    if (bytes.length === PACKET_LENGTH_LEGACY) return AthloniaBandService.decodeAthloniaPacket(bytes);
    return null;
  }
}

let _sharedInstance = null;

// Dev-only debug hook (safe to remove): lets you test from the browser console
// via window.__athloniaBand. Never shipped in production builds since Vite
// tree-shakes unreachable code paths in production.
if (typeof window !== 'undefined') {
  window.__athloniaBand = () => getAthloniaBandService();
}
export function getAthloniaBandService() {
  if (!_sharedInstance) _sharedInstance = new AthloniaBandService();
  return _sharedInstance;
}