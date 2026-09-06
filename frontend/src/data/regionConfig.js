export const PUNE_REGIONS = [
  {
    id: 'Kothrud',
    color: '#4CAF50',
    center: [18.46, 73.80],
    boundaries: [
      [18.50, 73.70],
      [18.52, 73.75],
      [18.55, 73.78],
      [18.50, 73.85],
      [18.48, 73.88],
      [18.44, 73.90],
      [18.40, 73.85],
      [18.38, 73.80],
      [18.38, 73.75],
      [18.42, 73.70],
    ],
  },
  {
    id: 'Hinjewadi',
    color: '#2196F3',
    center: [18.56, 73.76],
    boundaries: [
      [18.58, 73.70],
      [18.60, 73.75],
      [18.62, 73.80],
      [18.58, 73.85],
      [18.55, 73.88],
      [18.50, 73.85],
      [18.52, 73.78],
      [18.55, 73.75],
      [18.52, 73.70],
    ],
  },
  {
    id: 'Baner',
    color: '#9C27B0',
    center: [18.64, 73.88],
    boundaries: [
      [18.70, 73.82],
      [18.72, 73.88],
      [18.70, 73.94],
      [18.66, 73.96],
      [18.62, 73.95],
      [18.60, 73.90],
      [18.58, 73.85],
      [18.60, 73.80],
      [18.65, 73.78],
    ],
  },
  {
    id: 'Shivaji Nagar',
    color: '#E91E63',
    center: [18.52, 73.88],
    boundaries: [
      [18.58, 73.85],
      [18.60, 73.90],
      [18.58, 73.95],
      [18.54, 73.98],
      [18.50, 73.97],
      [18.48, 73.92],
      [18.48, 73.88],
      [18.50, 73.85],
      [18.55, 73.84],
    ],
  },
  {
    id: 'Viman Nagar',
    color: '#FF9800',
    center: [18.62, 73.96],
    boundaries: [
      [18.66, 73.92],
      [18.68, 73.95],
      [18.70, 74.00],
      [18.64, 74.03],
      [18.58, 74.02],
      [18.55, 74.00],
      [18.54, 73.95],
      [18.56, 73.90],
      [18.60, 73.88],
    ],
  },
  {
    id: 'Hadapsar',
    color: '#00BCD4',
    center: [18.49, 73.94],
    boundaries: [
      [18.56, 73.90],
      [18.58, 73.95],
      [18.55, 74.02],
      [18.50, 74.04],
      [18.45, 74.03],
      [18.42, 74.00],
      [18.40, 73.95],
      [18.40, 73.90],
      [18.44, 73.86],
      [18.48, 73.85],
      [18.50, 73.88],
    ],
  },
  {
    id: 'Pimpri',
    color: '#FF5722',
    center: [18.66, 73.76],
    boundaries: [
      [18.70, 73.70],
      [18.72, 73.76],
      [18.70, 73.82],
      [18.65, 73.85],
      [18.60, 73.82],
      [18.55, 73.78],
      [18.58, 73.72],
      [18.65, 73.68],
    ],
  },
];

export const REGION_LEVEL_THRESHOLDS = [0, 20000, 50000, 100000, 200000];
export const BUILDING_NAMES = ['Energy Spark', 'Community Power', 'Tide Hut', 'Ocean Citadel', "Poseidon's Hub"];
export const BUILDING_EMOJIS = ['⚡', '👥', '🏠', '🏰', '👑'];

export function getRegionLevel(totalEnergy) {
  let level = 1;
  for (let i = 0; i < REGION_LEVEL_THRESHOLDS.length; i++) {
    if (totalEnergy >= REGION_LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, 5);
}

export function getBuildingName(totalEnergy) {
  return BUILDING_NAMES[getRegionLevel(totalEnergy) - 1];
}

export function getBuildingEmoji(totalEnergy) {
  return BUILDING_EMOJIS[getRegionLevel(totalEnergy) - 1];
}

export function getRegionById(regionId) {
  return PUNE_REGIONS.find(r => r.id === regionId);
}