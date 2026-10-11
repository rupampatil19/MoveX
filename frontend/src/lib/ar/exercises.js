/**
 * Exercise definitions for AR workouts.
 * Ported from AR Fit (TS to JS).
 */
import { PUSHUP_CFG, SQUAT_CFG, BURPEE_CFG, SITUP_CFG, JUMPING_JACK_CFG } from './repCounter.js';
import { PushupAnalyzer, SquatAnalyzer } from './analyzers.js';
import { BurpeeAnalyzer, SitupAnalyzer, JumpingJackAnalyzer } from './extraAnalyzers.js';

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
  {
    id: 'burpee',
    name: 'Burpee',
    tagline: 'Full Body - Conditioning',
    targetReps: 8,
    primaryJoint: 'Knee angle + torso orientation',
    placement: 'Prop the phone at hip height, side-on, 2 to 2.5 m away; keep the full body in view',
    modelUrl: 'models/burpee.fbx',
    instructions: [
      'Start standing with feet about shoulder-width apart',
      'Squat and place hands on the floor, then step or jump back to plank',
      'Keep the trunk controlled; return feet near hands and stand tall',
      'Step instead of jumping for a lower-impact version',
    ],
    ghostBones: squatGhostBones,
    ghostJoints: squatGhostBones.flatMap((b) => [b.a, b.b]),
    repCfg: BURPEE_CFG,
    makeAnalyzer: () => new BurpeeAnalyzer(),
  },
  {
    id: 'situps',
    name: 'Sit-Ups',
    tagline: 'Abs - Core',
    targetReps: 12,
    primaryJoint: 'Shoulder-hip-knee angle',
    placement: 'Phone on the floor or low support, side-on, 1.5 to 2 m away; keep shoulders and knees visible',
    modelUrl: 'models/situps.fbx',
    instructions: [
      'Lie on your back with knees bent and feet planted',
      'Curl your torso upward without pulling on your neck',
      'Lower under control; keep movement smooth rather than bouncing',
      'Stop if you feel back or neck pain',
    ],
    ghostBones: squatGhostBones,
    ghostJoints: squatGhostBones.flatMap((b) => [b.a, b.b]),
    repCfg: SITUP_CFG,
    makeAnalyzer: () => new SitupAnalyzer(),
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    tagline: 'Cardio - Full Body',
    targetReps: 20,
    primaryJoint: 'Arm elevation + symmetry',
    placement: 'Prop the phone at chest height, facing you, 2 to 3 m away; keep your full body in view',
    modelUrl: 'models/jumping-jacks.fbx',
    instructions: [
      'Stand tall with feet together and arms by your sides',
      'Jump feet apart while raising arms overhead',
      'Return to the start position and count one full open-close cycle',
      'Land softly; use side steps instead of jumps for low impact',
    ],
    ghostBones: pushupGhostBones,
    ghostJoints: pushupGhostBones.flatMap((b) => [b.a, b.b]),
    repCfg: JUMPING_JACK_CFG,
    makeAnalyzer: () => new JumpingJackAnalyzer(),
  },
];

export function getExerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}