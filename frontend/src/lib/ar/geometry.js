/**
 * AR pose geometry helpers.
 * Ported from AR Fit (TS → JS). Pure functions, no side effects.
 *
 * A "KP" is a pose keypoint: { x, y, score?, name? }
 * Coordinates are normalized 0..1 (image space).
 */

/** Angle at joint b formed by a-b-c, in degrees (0-180). */
export function jointAngle(a, b, c) {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);
  if (magAB === 0 || magCB === 0) return 180;
  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Euclidean distance between two keypoints. */
export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Midpoint between two keypoints. */
export function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Whether a keypoint is visible (above confidence threshold). */
export function visible(p, min = 0.35) {
  return !!p && (p.score ?? 0) >= min;
}

/** Map raw pose keypoints array to a name-keyed map. */
export function toKPMap(keypoints) {
  const map = {};
  for (const k of keypoints) if (k.name) map[k.name] = k;
  return map;
}

/**
 * Best estimate of a limb angle from both sides.
 * Picks the side with higher mean confidence; averages both sides only when they agree.
 *
 * @param {Object} kps - name -> KP map
 * @param {Array<[string,string,string]>} names - [[leftTriplet, rightTriplet]]
 * @param {number} minScore - confidence threshold
 * @returns {{ deg: number, at: Object } | null}
 */
export function bestLimbAngle(kps, names, minScore = 0.3) {
  const sides = names
    .map(([a, b, c]) => {
      const A = kps[a], B = kps[b], C = kps[c];
      if (!visible(A, minScore) || !visible(B, minScore) || !visible(C, minScore)) return null;
      return {
        deg: jointAngle(A, B, C),
        at: B,
        conf: ((A.score ?? 0) + (B.score ?? 0) + (C.score ?? 0)) / 3,
      };
    })
    .filter((x) => x !== null);
  if (!sides.length) return null;
  if (sides.length === 2 && Math.abs(sides[0].deg - sides[1].deg) < 25) {
    return {
      deg: (sides[0].deg + sides[1].deg) / 2,
      at: sides[0].conf >= sides[1].conf ? sides[0].at : sides[1].at,
    };
  }
  sides.sort((x, y) => y.conf - x.conf);
  return { deg: sides[0].deg, at: sides[0].at };
}

/**
 * Whether the person faces the camera (front view) vs. standing side-on.
 * Returns null if key points aren't visible.
 */
export function isFrontal(kps) {
  const ls = kps['left_shoulder'];
  const rs = kps['right_shoulder'];
  const lh = kps['left_hip'];
  const rh = kps['right_hip'];
  if (!visible(ls) || !visible(rs) || !visible(lh) || !visible(rh)) return null;
  const sw = dist(ls, rs);
  const torso = dist(mid(ls, lh), mid(rh, rh));
  return sw / Math.max(1e-3, torso) > 0.6;
}
