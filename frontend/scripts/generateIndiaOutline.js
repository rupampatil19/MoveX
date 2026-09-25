/**
 * Generates public/geojson/india-outline.geojson by dissolving all
 * state features into one country outline.
 *
 * ESM version — matches the project's "type": "module".
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const statesPath = path.join(__dirname, '..', 'public', 'geojson', 'india-states.geojson');
const outPath    = path.join(__dirname, '..', 'public', 'geojson', 'india-outline.geojson');

console.log('Loading @turf/union…');

let unionFn;
try {
  const mod = await import('@turf/union');
  unionFn = mod.default || mod.union || mod;
  if (typeof unionFn === 'object') {
    // sometimes default is the object wrapper
    unionFn = unionFn.default || unionFn.union || unionFn;
  }
  if (typeof unionFn !== 'function') {
    console.log('  Available exports:', Object.keys(mod));
    throw new Error('No callable union export found');
  }
  console.log('  Resolved union function ✓');
} catch (e) {
  console.error('Failed to load @turf/union:', e.message);
  process.exit(1);
}

console.log('\nReading', statesPath);
if (!fs.existsSync(statesPath)) {
  console.error('  india-states.geojson NOT FOUND');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
if (!data.features || data.features.length === 0) {
  console.error('  No features in india-states.geojson');
  process.exit(1);
}
console.log(`  Loaded ${data.features.length} state features`);

console.log('\nDissolving into one outline…');
let merged = data.features[0];
let failed = 0;
for (let i = 1; i < data.features.length; i++) {
  try {
    merged = unionFn(merged, data.features[i]);
  } catch (e) {
    failed++;
    if (failed <= 5) console.warn(`  feature ${i} skipped: ${e.message}`);
  }
}
if (failed > 0) console.warn(`  (${failed} features skipped total)`);

const output = {
  type: 'FeatureCollection',
  features: Array.isArray(merged) ? merged : [merged],
};

console.log('\nWriting', outPath);
fs.writeFileSync(outPath, JSON.stringify(output));
const stats = fs.statSync(outPath);
console.log(`✅ Done. Output size: ${(stats.size / 1024).toFixed(1)} KB`);
console.log(`   Geometries in output: ${output.features.length}`);