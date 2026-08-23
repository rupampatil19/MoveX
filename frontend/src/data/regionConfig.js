// Seven official Pune region centers and colors.
// Polygons are generated in MapPage as wavy radial sectors (no overlap).
export const PUNE_REGIONS = [
  { id: 'Kothrud', center: [18.5074, 73.8077], color: '#2563EB' },
  { id: 'Hinjewadi', center: [18.5913, 73.7389], color: '#2196F3' },
  { id: 'Baner', center: [18.5679, 73.7903], color: '#9C27B0' },
  { id: 'Shivaji Nagar', center: [18.5300, 73.8500], color: '#E91E63' },
  { id: 'Viman Nagar', center: [18.5663, 73.9169], color: '#FF9800' },
  { id: 'Hadapsar', center: [18.5089, 73.9260], color: '#00BCD4' },
  { id: 'Pimpri', center: [18.6229, 73.8030], color: '#FF5722' },
];

export const REGION_LEVEL_THRESHOLDS = [0, 20000, 50000, 100000, 200000];
export const BUILDING_NAMES = ['Tide Hut', 'Wave Dock', 'Aqua Bastion', 'Ocean Citadel', "Poseidon's Hub"];
export const BUILDING_EMOJIS = ['🏖️', '⚓', '🏰', '🏯', '🔱'];

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