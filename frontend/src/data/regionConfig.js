// Seven official Pune region centers and colors.
// Boundaries are generated dynamically in MapPage/DashboardMap using a wavy sector partition.
export const PUNE_REGIONS = [
  { id: 'Kothrud', center: [18.46, 73.80], color: '#4CAF50' },
  { id: 'Hinjewadi', center: [18.56, 73.76], color: '#2196F3' },
  { id: 'Baner', center: [18.64, 73.88], color: '#9C27B0' },
  { id: 'Shivaji Nagar', center: [18.52, 73.88], color: '#E91E63' },
  { id: 'Viman Nagar', center: [18.62, 73.96], color: '#FF9800' },
  { id: 'Hadapsar', center: [18.49, 73.94], color: '#00BCD4' },
  { id: 'Pimpri', center: [18.66, 73.76], color: '#FF5722' },
];

// Thresholds and building names (kept for backward compatibility)
export const REGION_LEVEL_THRESHOLDS = [0, 20000, 50000, 100000, 200000];
export const BUILDING_NAMES = ['Tide Hut', 'Wave Dock', 'Aqua Bastion', 'Ocean Citadel', "Poseidon's Hub"];
export const BUILDING_EMOJIS = ['🛖', '⚓', '🏰', '🏯', '🔱'];

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

// Import and re-export the Hub asset mapping from hubAssets.js
import { getHubImagePath, getHubName } from './hubAssets';
export { getHubImagePath, getHubName };