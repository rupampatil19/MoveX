/**
 * Generates public/geojson/india-outline.geojson by dissolving all
 * features in public/geojson/india-states.geojson into one country outline.
 *
 * Run once:  node scripts\generateIndiaOutline.js
 */
const fs = require('fs');
const path = require('path');

// @turf/union has changed its export shape across versions.
// Handle all common cases.
let union = require('@turf/union');
if (typeof union !== 'function') {
  union = union.default || union.union;
}
if (typeof union !== 'function') {
  console.error('Could not resolve @turf/union — check package version.');
  process.exit(1);
}

const statesPath = path.join(__dirname, '..', 'public', 'geojson', 'india-states.geojson');
const outPath    = path.join(__dirname, '..', 'public', 'geojson', 'india-outline.geojson');

console.log('Reading', statesPath);
const data = JSON.parse(fs.readFileSync(statesPath, 'utf8'));

if (!data.features || data.features.length === 0) {
  console.error('No features in india-states.geojson');
  process.exit(1);
}

console.log(`Dissolving ${data.features.length} state features…`);

let merged = data.features[0];
let skipped = 0;
for (let i = 1; i < data.features.length; i++) {
  try {
    merged = union(merged, data.features[i]);
  } catch (e) {
    skipped++;
    console.warn(`  skipped feature ${i}: ${e.message}`);
  }
}

// Wrap in a FeatureCollection for Leaflet compatibility
const output = {
  type: 'FeatureCollection',
  features: Array.isArray(merged) ? merged : [merged],
};

console.log(`Writing ${outPath}`);
fs.writeFileSync(outPath, JSON.stringify(output));
console.log(`✅ Done. ${skipped} features skipped.`);