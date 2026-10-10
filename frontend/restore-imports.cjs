const fs = require('fs');
const path = 'C:/Users/Rupam/MoveX/frontend/src/pages/StartActivityPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// Backup
fs.writeFileSync(path + '.bak', content);

// Find where the real code starts (first const activityTypes)
const marker = 'const activityTypes = [';
const idx = content.indexOf(marker);

if (idx === -1) {
  console.log('FAIL: marker "const activityTypes = [" not found');
  console.log('First 500 chars of file:');
  console.log(content.slice(0, 500));
  process.exit(1);
}

console.log('Marker found at position:', idx);
console.log('Lines before marker:', content.slice(0, idx).split('\n').length - 1);

// Keep everything from the marker onward
const codeAfterImports = content.slice(idx);

// Prepend the correct import block
const correctImports = `import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Zap, Trophy, Flame, CheckCircle2, AlertTriangle, XCircle,
  MapPin, Users, Footprints, Bike, Dumbbell, PersonStanding,
  Play, Pause, Square, Satellite, WifiOff, ArrowRight, ExternalLink, Sparkles,
  Compass, Smartphone, Activity as ActivityIcon, ShieldCheck, X, Loader2,
  TrendingUp,
} from 'lucide-react';
import MoveXCard from '../components/ui/MoveXCard';
import MoveXGlassPanel from '../components/ui/MoveXGlassPanel';
import Button from '../components/ui/Button';
import MoveXMoment from '../components/MoveXMoment';
import { MoveXSensorService } from '../services/sensorService';

`;

const result = correctImports + codeAfterImports;
fs.writeFileSync(path, result, 'utf8');

console.log('SUCCESS: imports restored');
console.log('New file size:', result.length, 'bytes');

// Verify all critical imports exist
const required = [
  'useState', 'useEffect', 'useRef', 'useNavigate',
  'API', 'motion', 'AnimatePresence', 'confetti',
  'TrendingUp', 'Sparkles', 'Compass', 'Smartphone',
  'MoveXCard', 'MoveXGlassPanel', 'Button', 'MoveXMoment',
  'MoveXSensorService'
];

let allGood = true;
for (const r of required) {
  if (result.includes(r)) {
    console.log('OK:', r);
  } else {
    console.log('MISSING:', r);
    allGood = false;
  }
}

if (allGood) {
  console.log('\\nAll imports verified. Deleting backup.');
  fs.unlinkSync(path + '.bak');
} else {
  console.log('\\nSome imports missing — backup preserved at ' + path + '.bak');
}
