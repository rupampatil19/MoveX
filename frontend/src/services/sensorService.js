/**
 * MoveXSensorService
 *
 * Unified sensor capture pipeline.
 *   · GPS (geolocation)
 *   · Accelerometer (motion)
 *   · Gyroscope (rotation)
 *   · Magnetometer (compass/heading)
 *
 * Captures at 50 Hz internally, aggregates to 1 Hz samples.
 * Feeds into backend AVS for fraud detection.
 */

const FLUSH_INTERVAL_MS = 1000;
const SAMPLE_RATE_HZ = 50;

export class MoveXSensorService {
  constructor() {
    this.gpsPoints = [];
    this.motionSamples = [];

    this.gpsWatchId = null;
    this.accelSensor = null;
    this.gyroSensor = null;
    this.magSensor = null;

    this._accelSum = { x: 0, y: 0, z: 0 }; this._accelCount = 0;
    this._gyroSum  = { x: 0, y: 0, z: 0 }; this._gyroCount  = 0;
    this._magSum   = { x: 0, y: 0, z: 0 }; this._magCount   = 0;

    this._flushTimer = null;
    this.running = false;

    this.permissions = {
      geolocation:    'unknown',
      accelerometer:  'unknown',
      gyroscope:      'unknown',
      magnetometer:   'unknown',
    };

    this.gpsError = null;
  }

  // ----------------------------------------------------------
  // CAPABILITY DETECTION
  // ----------------------------------------------------------
  getCapabilities() {
    return {
      geolocation:   typeof navigator !== 'undefined' && 'geolocation' in navigator,
      accelerometer: typeof window !== 'undefined' && 'Accelerometer' in window,
      gyroscope:     typeof window !== 'undefined' && 'Gyroscope' in window,
      magnetometer:  typeof window !== 'undefined' && 'Magnetometer' in window,
    };
  }

  // ----------------------------------------------------------
  // PERMISSION REQUEST
  // ----------------------------------------------------------
  async requestPermissions() {
    const caps = this.getCapabilities();
    const status = { ...this.permissions };

    // Geolocation — will trigger browser prompt
    if (!caps.geolocation) {
      status.geolocation = 'unavailable';
    } else {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
          });
        });
        status.geolocation = 'granted';
      } catch (err) {
        status.geolocation = err.code === 1 ? 'denied' : 'unavailable';
      }
    }

    // Motion sensors — some browsers auto-grant, some prompt
    status.accelerometer = await this._testSensor('Accelerometer');
    status.gyroscope     = await this._testSensor('Gyroscope');
    status.magnetometer  = await this._testSensor('Magnetometer');

    this.permissions = status;
    return status;
  }

  async _testSensor(ctorName) {
    if (typeof window === 'undefined' || !(ctorName in window)) return 'unavailable';
    try {
      const sensor = new window[ctorName]({ frequency: 1 });
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          try { sensor.stop(); } catch {}
          resolve(); // consider granted if no error fired
        }, 1500);
        sensor.addEventListener('reading', () => {
          clearTimeout(timer);
          try { sensor.stop(); } catch {}
          resolve();
        }, { once: true });
        sensor.addEventListener('error', (e) => {
          clearTimeout(timer);
          try { sensor.stop(); } catch {}
          reject(e);
        }, { once: true });
        sensor.start();
      });
      return 'granted';
    } catch (err) {
      if (err.name === 'NotAllowedError') return 'denied';
      return 'unavailable';
    }
  }

  // ----------------------------------------------------------
  // START / STOP
  // ----------------------------------------------------------
  async start() {
    if (this.running) return;
    this.running = true;

    this.gpsPoints = [];
    this.motionSamples = [];
    this.gpsError = null;

    this._startGps();
    this._startAccelerometer();
    this._startGyroscope();
    this._startMagnetometer();

    this._flushTimer = setInterval(() => this._flush(), FLUSH_INTERVAL_MS);
  }

  stop() {
    if (!this.running) return;
    this.running = false;

    if (this.gpsWatchId != null) {
      try { navigator.geolocation.clearWatch(this.gpsWatchId); } catch {}
      this.gpsWatchId = null;
    }
    if (this.accelSensor) { try { this.accelSensor.stop(); } catch {} this.accelSensor = null; }
    if (this.gyroSensor)  { try { this.gyroSensor.stop();  } catch {} this.gyroSensor = null; }
    if (this.magSensor)   { try { this.magSensor.stop();   } catch {} this.magSensor = null; }

    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }
    this._flush(); // final flush
  }

  // ----------------------------------------------------------
  // CAPTURE — GPS
  // ----------------------------------------------------------
  _startGps() {
    if (!('geolocation' in navigator)) return;
    try {
      this.gpsWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, altitude, speed, heading } = pos.coords;
          if (accuracy > 50) return;
          this.gpsPoints.push({
            t:   pos.timestamp,
            lat: latitude,
            lng: longitude,
            acc: accuracy,
            alt: altitude,
            spd: speed,
            hdg: heading,
          });
        },
        (err) => {
          this.gpsError = err.code === 1 ? 'denied' : 'unavailable';
          console.warn('GPS error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
      );
    } catch (err) {
      console.warn('GPS start failed:', err);
    }
  }

  // ----------------------------------------------------------
  // CAPTURE — Sensors
  // ----------------------------------------------------------
  _startAccelerometer() {
    if (!('Accelerometer' in window)) return;
    try {
      this.accelSensor = new Accelerometer({ frequency: SAMPLE_RATE_HZ });
      this.accelSensor.addEventListener('reading', () => {
        this._accelSum.x += this.accelSensor.x;
        this._accelSum.y += this.accelSensor.y;
        this._accelSum.z += this.accelSensor.z;
        this._accelCount++;
      });
      this.accelSensor.addEventListener('error', () => { /* sensor unavailable — handled gracefully */ });
      this.accelSensor.start();
    } catch (err) {
      console.warn('Accelerometer start failed:', err);
    }
  }

  _startGyroscope() {
    if (!('Gyroscope' in window)) return;
    try {
      this.gyroSensor = new Gyroscope({ frequency: SAMPLE_RATE_HZ });
      this.gyroSensor.addEventListener('reading', () => {
        this._gyroSum.x += this.gyroSensor.x;
        this._gyroSum.y += this.gyroSensor.y;
        this._gyroSum.z += this.gyroSensor.z;
        this._gyroCount++;
      });
      this.gyroSensor.addEventListener('error', () => { /* sensor unavailable — handled gracefully */ });
      this.gyroSensor.start();
    } catch (err) {
      console.warn('Gyroscope start failed:', err);
    }
  }

  _startMagnetometer() {
    if (!('Magnetometer' in window)) return;
    try {
      this.magSensor = new Magnetometer({ frequency: SAMPLE_RATE_HZ });
      this.magSensor.addEventListener('reading', () => {
        this._magSum.x += this.magSensor.x;
        this._magSum.y += this.magSensor.y;
        this._magSum.z += this.magSensor.z;
        this._magCount++;
      });
      this.magSensor.addEventListener('error', () => { /* sensor unavailable — handled gracefully */ });
      this.magSensor.start();
    } catch (err) {
      console.warn('Magnetometer start failed:', err);
    }
  }

  // ----------------------------------------------------------
  // FLUSH — aggregate 50 Hz samples into 1 Hz
  // ----------------------------------------------------------
  _flush() {
    if (this._accelCount === 0 && this._gyroCount === 0 && this._magCount === 0) return;

    const ax = this._accelCount ? this._accelSum.x / this._accelCount : 0;
    const ay = this._accelCount ? this._accelSum.y / this._accelCount : 0;
    const az = this._accelCount ? this._accelSum.z / this._accelCount : 0;
    const gx = this._gyroCount ? this._gyroSum.x / this._gyroCount : 0;
    const gy = this._gyroCount ? this._gyroSum.y / this._gyroCount : 0;
    const gz = this._gyroCount ? this._gyroSum.z / this._gyroCount : 0;
    const mx = this._magCount ? this._magSum.x / this._magCount : 0;
    const my = this._magCount ? this._magSum.y / this._magCount : 0;
    const mz = this._magCount ? this._magSum.z / this._magCount : 0;

    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    const intensity = Math.max(0, Math.min(100, Math.round((magnitude - 9.8) * 8 + 20)));
    const stillness = intensity < 10 ? 100 - intensity : 0;

    // Heading from magnetometer (0-360°)
    const heading = (Math.atan2(my, mx) * 180 / Math.PI + 360) % 360;

    this.motionSamples.push({
      t: Date.now(),
      ax, ay, az,
      gx, gy, gz,
      mx, my, mz,
      magnitude: Number(magnitude.toFixed(3)),
      intensity,
      stillness,
      heading: Number(heading.toFixed(1)),
    });

    this._accelSum = { x: 0, y: 0, z: 0 }; this._accelCount = 0;
    this._gyroSum  = { x: 0, y: 0, z: 0 }; this._gyroCount  = 0;
    this._magSum   = { x: 0, y: 0, z: 0 }; this._magCount   = 0;
  }

  // ----------------------------------------------------------
  // EXPORT SNAPSHOT
  // ----------------------------------------------------------
  getSnapshot() {
    const gpsCount = this.gpsPoints.length;
    const motionCount = this.motionSamples.length;

    return {
      gps: {
        points: this.gpsPoints,
        count: gpsCount,
        avgAccuracy: gpsCount
          ? Math.round(this.gpsPoints.reduce((s, p) => s + p.acc, 0) / gpsCount)
          : null,
        error: this.gpsError,
      },
      motion: {
        samples: this.motionSamples,
        count: motionCount,
        avgIntensity: motionCount
          ? Math.round(this.motionSamples.reduce((s, m) => s + m.intensity, 0) / motionCount)
          : 0,
      },
      permissions: this.permissions,
    };
  }

  // ----------------------------------------------------------
  // CLIENT-SIDE PREVIEW VALIDATION
  // ----------------------------------------------------------
  getValidation() {
    const samples = this.motionSamples;
    const gpsCount = this.gpsPoints.length;

    if (samples.length < 10) {
      return {
        valid: false,
        score: 0,
        reason: 'Not enough motion samples',
        samples: samples.length,
        gpsPoints: gpsCount,
      };
    }

    // Gait frequency from az peaks
    const azValues = samples.map((s) => s.az);
    const peaks = [];
    for (let i = 1; i < azValues.length - 1; i++) {
      if (
        azValues[i] > azValues[i - 1] &&
        azValues[i] > azValues[i + 1] &&
        azValues[i] > 0.5
      ) {
        peaks.push(i);
      }
    }
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    const avgInterval = intervals.length
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 0;
    const frequency = avgInterval > 0 ? 1 / avgInterval : 0;

    // Gait variance
    const mean = avgInterval;
    const std = intervals.length > 1
      ? Math.sqrt(intervals.reduce((s, x) => s + (x - mean) ** 2, 0) / intervals.length)
      : 0;
    const variance = mean > 0 ? std / mean : 0;

    // Heading stability
    const headings = samples.map((s) => s.heading).filter((h) => h > 0);
    const headingRange = headings.length
      ? Math.max(...headings) - Math.min(...headings)
      : 0;

    const gaitOk = frequency >= 1.2 && frequency <= 3.2;
    const varianceOk = variance >= 0.02 && variance <= 0.5;
    const headingOk = headingRange < 300;

    let score = 0;
    if (gpsCount > 0) score += 25;
    if (samples.length > 30) score += 15;
    if (gaitOk) score += 25;
    if (varianceOk) score += 15;
    if (this.permissions.magnetometer === 'granted' && headingOk) score += 20;

    return {
      valid: score >= 60,
      score,
      frequency: Number(frequency.toFixed(2)),
      variance: Number(variance.toFixed(3)),
      headingRange: Number(headingRange.toFixed(1)),
      gaitOk,
      varianceOk,
      headingOk,
      samples: samples.length,
      gpsPoints: gpsCount,
    };
  }
}