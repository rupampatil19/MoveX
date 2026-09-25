// Seven official Pune region centers and colors.
// Boundaries are generated dynamically in MapPage/DashboardMap using a wavy sector partition.
// Supports any city via optional centerOverride + options (ocean capping).

export const CENTER = { lat: 18.56, lng: 73.85 }; // Pune default
const OUTER_RADIUS = 0.15;
const OCEAN_RADIUS_FACTOR_DEFAULT = 0.35;

function project(lat, lng, C) {
  return { x: (lng - C.lng) * Math.cos((C.lat * Math.PI) / 180), y: lat - C.lat };
}
function unproject(x, y, C) {
  return [y + C.lat, x / Math.cos((C.lat * Math.PI) / 180) + C.lng];
}
function angleOf(lat, lng, C) {
  const p = project(lat, lng, C);
  return Math.atan2(p.y, p.x);
}

function normalizeAngle(a) {
  let x = a % (2 * Math.PI);
  if (x < 0) x += 2 * Math.PI;
  return x;
}

function isAngleInOceanRange(angleRad, oceanRanges) {
  if (!oceanRanges || oceanRanges.length === 0) return false;
  const na = normalizeAngle(angleRad);
  for (const r of oceanRanges) {
    const fromRad = (r.fromDeg * Math.PI) / 180;
    const toRad = (r.toDeg * Math.PI) / 180;
    const from = normalizeAngle(fromRad);
    const to = normalizeAngle(toRad);
    if (from <= to) {
      if (na >= from && na <= to) return true;
    } else {
      if (na >= from || na <= to) return true;
    }
  }
  return false;
}

export function generateRegionPolygons(REGIONS, centerOverride, options) {
  const C = centerOverride || CENTER;
  const n = REGIONS.length;
  if (n === 0) return {};

  const baseRadius = options?.baseRadius ?? OUTER_RADIUS;
  const oceanRanges = options?.oceanRanges ?? [];
  const oceanRadius =
    baseRadius * (options?.oceanRadiusFactor ?? OCEAN_RADIUS_FACTOR_DEFAULT);

  // Radius at a given angle — capped if the angle points into the ocean
  function radiusAt(angle) {
    return isAngleInOceanRange(angle, oceanRanges) ? oceanRadius : baseRadius;
  }

  // 1. Region angles in [0, 2π)
  const regionData = REGIONS.map((r, i) => {
    let a = angleOf(r.center[0], r.center[1], C);
    if (a < 0) a += 2 * Math.PI;
    return { index: i, region: r, angle: a };
  });

  // 2. Sort by angle
  regionData.sort((a, b) => a.angle - b.angle);
  const sortedAngles = regionData.map((d) => d.angle);

  const polygons = {};

  for (let k = 0; k < n; k++) {
    const { region, angle: aCurr } = regionData[k];

    let aPrev =
      k === 0 ? sortedAngles[n - 1] - 2 * Math.PI : sortedAngles[k - 1];
    let aNext =
      k === n - 1 ? sortedAngles[0] + 2 * Math.PI : sortedAngles[k + 1];

    if (aPrev >= aCurr) aPrev -= 2 * Math.PI;
    if (aNext <= aCurr) aNext += 2 * Math.PI;

    const startAngle = (aPrev + aCurr) / 2;
    const endAngle = (aCurr + aNext) / 2;
    const angularSpan = endAngle - startAngle;

    const steps = 10;
    const arcSteps = 20;
    const points = [];
    points.push([C.lat, C.lng]);

    // Radial edge along startAngle (radius depends on direction)
    const startRadius = radiusAt(startAngle);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const r = startRadius * t;
      const wave = Math.sin(t * Math.PI * 3) * 0.006;
      const perpAngle = startAngle + Math.PI / 2;
      const x = Math.cos(startAngle) * r + Math.cos(perpAngle) * wave;
      const y = Math.sin(startAngle) * r + Math.sin(perpAngle) * wave;
      points.push(unproject(x, y, C));
    }

    // Outer arc — radius varies smoothly with angle (ocean cap when applicable)
    for (let s = 1; s < arcSteps; s++) {
      const t = s / arcSteps;
      const angle = startAngle + angularSpan * t;
      const outerWave = Math.sin(t * Math.PI * 5) * 0.005;
      const r = radiusAt(angle) + outerWave;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      points.push(unproject(x, y, C));
    }

    // Radial edge along endAngle
    const endRadius = radiusAt(endAngle);
    for (let s = steps; s >= 0; s--) {
      const t = s / steps;
      const r = endRadius * t;
      const wave = Math.sin(t * Math.PI * 3 + 1) * 0.006;
      const perpAngle = endAngle + Math.PI / 2;
      const x = Math.cos(endAngle) * r + Math.cos(perpAngle) * wave;
      const y = Math.sin(endAngle) * r + Math.sin(perpAngle) * wave;
      points.push(unproject(x, y, C));
    }

    polygons[region.id] = points;
  }

  return polygons;
}

export function calculateCentroid(coords) {
  if (!coords || coords.length === 0) return [CENTER.lat, CENTER.lng];
  let latSum = 0;
  let lngSum = 0;
  coords.forEach(([lat, lng]) => {
    latSum += lat;
    lngSum += lng;
  });
  return [latSum / coords.length, lngSum / coords.length];
}