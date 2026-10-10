// patch-server-tinyfish.cjs
// Adds TinyFish routes + cron to server.js. Idempotent - safe to re-run.

const fs = require('fs');
const FILE = 'C:\\Users\\Rupam\\MoveX\\backend\\server.js';

let src = fs.readFileSync(FILE, 'utf8');
const hasCRLF = src.indexOf('\r\n') !== -1;
let s = hasCRLF ? src.split('\r\n').join('\n') : src;

let changes = 0, skips = 0, misses = 0;

function apply(name, anchor, insert, alreadyMarker) {
  if (alreadyMarker && s.indexOf(alreadyMarker) !== -1) {
    console.log('SKIP: ' + name + ' (already patched)');
    skips++;
    return;
  }
  const i = s.indexOf(anchor);
  if (i === -1) {
    console.error('MISS: ' + name + ' - anchor not found');
    misses++;
    return;
  }
  if (s.indexOf(anchor, i + anchor.length) !== -1) {
    console.error('WARN: ' + name + ' - anchor not unique, skipping');
    misses++;
    return;
  }
  s = s.slice(0, i) + insert + anchor + s.slice(i + anchor.length);
  console.log('OK:   ' + name);
  changes++;
}

// 1. Requires
apply(
  'requires: add TinyFish requires',
  "const mongoose = require('mongoose');",
  [
    "const gearRoutes = require('./routes/gear');",
    "const dynamicQuestRoutes = require('./routes/dynamicQuests');",
    "const { startDynamicQuestCron } = require('./services/dynamicQuestCron');",
    '',
  ].join('\n'),
  "require('./routes/gear')"
);

// 2. Mount routes
(function mountRoutes() {
  if (s.indexOf("app.use('/api/gear'") !== -1) {
    console.log('SKIP: routes mount (already patched)');
    skips++;
    return;
  }
  const anchor = "app.use('/api/auth'";
  const i = s.indexOf(anchor);
  if (i === -1) {
    console.error('MISS: routes mount - anchor not found');
    misses++;
    return;
  }
  const insert = [
    "app.use('/api/gear', gearRoutes);",
    "app.use('/api/dynamic-quests', dynamicQuestRoutes);",
    '',
  ].join('\n');
  s = s.slice(0, i) + insert + s.slice(i);
  console.log('OK:   routes mount');
  changes++;
})();

// 3. Cron start inside mongoose .then()
(function startCron() {
  if (s.indexOf('startDynamicQuestCron()') !== -1) {
    console.log('SKIP: cron start (already patched)');
    skips++;
    return;
  }
  const anchor = 'mongoose.connect(';
  const i = s.indexOf(anchor);
  if (i === -1) {
    console.error('MISS: cron start - mongoose.connect( not found');
    misses++;
    return;
  }
  const thenIdx = s.indexOf('.then(', i);
  if (thenIdx === -1) {
    console.error('MISS: cron start - no .then( after mongoose.connect');
    misses++;
    return;
  }
  const braceIdx = s.indexOf('{', thenIdx);
  if (braceIdx === -1) {
    console.error('MISS: cron start - no { after .then(');
    misses++;
    return;
  }
  const insert = '\n    startDynamicQuestCron();';
  s = s.slice(0, braceIdx + 1) + insert + s.slice(braceIdx + 1);
  console.log('OK:   cron start inside mongoose .then()');
  changes++;
})();

if (misses > 0) {
  console.error('');
  console.error('ABORTED: ' + misses + ' op(s) missed. server.js NOT written.');
  process.exit(1);
}
if (changes === 0) {
  console.log('');
  console.log('server.js already at target state.');
  process.exit(0);
}

const out = hasCRLF ? s.split('\n').join('\r\n') : s;
fs.writeFileSync(FILE, out, 'utf8');

console.log('');
console.log('--------------------------------------------');
console.log('Changes: ' + changes);
console.log('Skipped: ' + skips);
console.log('--------------------------------------------');
console.log('server.js updated.');