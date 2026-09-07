export const CENTER = { lat: 18.56, lng: 73.85 };
const OUTER_RADIUS = 0.15;

function project(lat, lng) {
  return { x: (lng - CENTER.lng) * Math.cos(CENTER.lat * Math.PI / 180), y: lat - CENTER.lat };
}
function unproject(x, y) {
  return [y + CENTER.lat, x / Math.cos(CENTER.lat * Math.PI / 180) + CENTER.lng];
}
function angleOf(lat, lng) {
  const p = project(lat, lng);
  return Math.atan2(p.y, p.x);
}
function midAngle(a, b) {
  let diff = b - a;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  return a + diff / 2;
}

export function generateRegionPolygons(PUNE_REGIONS) {
  const sortedIndices = [...PUNE_REGIONS.keys()].sort((i, j) => {
    const r1 = PUNE_REGIONS[i];
    const r2 = PUNE_REGIONS[j];
    return angleOf(r1.center[0], r1.center[1]) - angleOf(r2.center[0], r2.center[1]);
  });
  const n = sortedIndices.length;
  const polygons = {};

  for (let k = 0; k < n; k++) {
    const region = PUNE_REGIONS[sortedIndices[k]];
    const prevRegion = PUNE_REGIONS[sortedIndices[(k - 1 + n) % n]];
    const nextRegion = PUNE_REGIONS[sortedIndices[(k + 1) % n]];

    const currAngle = angleOf(region.center[0], region.center[1]);
    const prevAngle = angleOf(prevRegion.center[0], prevRegion.center[1]);
    const nextAngle = angleOf(nextRegion.center[0], nextRegion.center[1]);

    const startAngle = midAngle(prevAngle, currAngle);
    const endAngle = midAngle(currAngle, nextAngle);

    let sectorStart = startAngle;
    let sectorEnd = endAngle;
    if (sectorEnd < sectorStart) sectorEnd += 2 * Math.PI;

    const steps = 10;
    const arcSteps = 20;
    const points = [];
    points.push([CENTER.lat, CENTER.lng]);

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const r = OUTER_RADIUS * t;
      const wave = Math.sin(t * Math.PI * 3) * 0.006;
      const perpAngle = sectorStart + Math.PI / 2;
      const x = Math.cos(sectorStart) * r + Math.cos(perpAngle) * wave;
      const y = Math.sin(sectorStart) * r + Math.sin(perpAngle) * wave;
      points.push(unproject(x, y));
    }

    for (let s = 1; s < arcSteps; s++) {
      const t = s / arcSteps;
      const angle = sectorStart + (sectorEnd - sectorStart) * t;
      const outerWave = Math.sin(t * Math.PI * 5) * 0.005;
      const r = OUTER_RADIUS + outerWave;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      points.push(unproject(x, y));
    }

    for (let s = steps; s >= 0; s--) {
      const t = s / steps;
      const r = OUTER_RADIUS * t;
      const wave = Math.sin(t * Math.PI * 3 + 1) * 0.006;
      const perpAngle = sectorEnd + Math.PI / 2;
      const x = Math.cos(sectorEnd) * r + Math.cos(perpAngle) * wave;
      const y = Math.sin(sectorEnd) * r + Math.sin(perpAngle) * wave;
      points.push(unproject(x, y));
    }

    polygons[region.id] = points;
  }

  return polygons;
}

export function calculateCentroid(coords) {
  if (!coords || coords.length === 0) return [CENTER.lat, CENTER.lng];
  let latSum = 0, lngSum = 0;
  coords.forEach(([lat, lng]) => { latSum += lat; lngSum += lng; });
  return [latSum / coords.length, lngSum / coords.length];
}