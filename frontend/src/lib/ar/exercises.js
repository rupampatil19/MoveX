/**
 * Exercise definitions for AR workouts.
 * Ported from AR Fit (TS to JS).
 */
import { PUSHUP_CFG, SQUAT_CFG } from './repCounter.js';
import { PushupAnalyzer, SquatAnalyzer } from './analyzers.js';

const pushupGhostBones = [
  { a: [0.22, 0.62], b: [0.32, 0.66] },
  { a: [0.32, 0.66], b: [0.55, 0.70] },
  { a: [0.55, 0.70], b: [0.80, 0.82] },
  { a: [0.32, 0.66], b: [0.315, 0.78] },
  { a: [0.315, 0.78], b: [0.31, 0.90] },
  { a: [0.55, 0.70], b: [0.68, 0.78] },
  { a: [0.68, 0.78], b: [0.80, 0.82] },
];

const squatGhostBones = [
  { a: [0.50, 0.42], b: [0.47, 0.60] },
  { a: [0.50, 0.42], b: [0.52, 0.36] },
  { a: [0.47, 0.60], b: [0.58, 0.68] },
  { a: [0.58, 0.68], b: [0.56, 0.86] },
  { a: [0.50, 0.44], b: [0.60, 0.52] },
  { a: [0.60, 0.52], b: [0.68, 0.50] },
];

export const SKELETON_PAIRS = [
  ['nose', 'left_eye'], ['nose', 'right_eye'],
  ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
];

export const EXERCISES = [
  {
    id: 'pushup',
    name: 'Push-Up',
    tagline: 'Chest - Triceps - Core',
    targetReps: 12,
    primaryJoint: 'Elbow angle',
    placement: 'Phone on the floor, side-on to you, 1.5 to 2 m away',
    modelUrl: 'models/pushup.fbx',
    instructions: [
      'Place your phone on the floor, camera facing you',
      'Make sure your full body is visible in frame',
      'Align with the AR target pose on the floor',
      'Adjust until you get Perfect Position',
    ],
    ghostBones: pushupGhostBones,
    ghostJoints: pushupGhostBones.flatMap((b) => [b.a, b.b]),
    repCfg: PUSHUP_CFG,
    makeAnalyzer: () => new PushupAnalyzer(),
  },
  {
    id: 'squat',
    name: 'Squat',
    tagline: 'Quads - Glutes - Core',
    targetReps: 15,
    primaryJoint: 'Knee angle',
    placement: 'Prop the phone at hip height, side-on to you, 2 to 2.5 m away',
    modelUrl: 'models/squat.fbx',
    instructions: [
      'Prop your phone up, camera facing your side',
      'Stand so your full body fits the frame',
      'Align with the AR target pose',
      'Adjust until you get Perfect Position',
    ],
    ghostBones: squatGhostBones,
    ghostJoints: squatGhostBones.flatMap((b) => [b.a, b.b]),
    repCfg: SQUAT_CFG,
    makeAnalyzer: () => new SquatAnalyzer(),
  },
];

export function getExerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}