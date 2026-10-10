/**
 * AVS Engine unit tests.
 * Covers: AR branch (pose-engine driven) and standard GPS branch.
 */

const { calculateAVS } = require('../avsEngine');

describe('AVS Engine', () => {

  describe('AR branch (pose detection workouts)', () => {

    test('high accuracy AR workout returns VERIFIED', () => {
      const result = calculateAVS('workout', {
        source: 'ar',
        ar: { accuracy: 92, reps: 20, target: 20, durationSec: 120, partials: 0 },
      });
      expect(result.decision).toBe('VERIFIED');
      expect(result.avs).toBeGreaterThanOrEqual(80);
      expect(result.detectedType).toBe('ar');
    });

    test('low reps AR workout returns lower AVS', () => {
      const result = calculateAVS('workout', {
        source: 'ar',
        ar: { accuracy: 60, reps: 2, target: 20, durationSec: 10, partials: 3 },
      });
      expect(result.avs).toBeLessThan(60);
      expect(result.decision).not.toBe('VERIFIED');
    });

    test('abandoned AR session is penalised', () => {
      const result = calculateAVS('workout', {
        source: 'ar',
        ar: { accuracy: 80, reps: 15, target: 15, durationSec: 8, partials: 0 },
      });
      // Very short duration should drop below a comparable long session
      expect(result.avs).toBeLessThan(90);
    });
  });

  describe('Standard GPS branch (running/walking/cycling)', () => {

    test('high-quality GPS run returns high AVS', () => {
      const result = calculateAVS('running', {
        gpsPoints: 100,
        duration: 30,
        avgHeartRate: 140,
        dataQualityScore: 90,
      });
      expect(result.avs).toBeGreaterThan(70);
      expect(result.detectedType).toBe('running');
    });

    test('low-quality GPS run returns lower AVS', () => {
      const result = calculateAVS('running', {
        gpsPoints: 5,
        duration: 3,
        dataQualityScore: 30,
      });
      expect(result.avs).toBeLessThan(70);
    });
  });

  describe('Edge cases', () => {

    test('missing rawData does not throw', () => {
      expect(() => calculateAVS('running', {})).not.toThrow();
    });

    test('unknown activity type does not throw', () => {
      expect(() => calculateAVS('unknown', {})).not.toThrow();
    });

    test('AVS is always clamped to 0-100', () => {
      const result = calculateAVS('running', {
        gpsPoints: 9999,
        duration: 9999,
        avgHeartRate: 200,
        dataQualityScore: 100,
      });
      expect(result.avs).toBeGreaterThanOrEqual(0);
      expect(result.avs).toBeLessThanOrEqual(100);
    });
  });
});