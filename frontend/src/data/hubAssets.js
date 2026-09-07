// Centralized Hub asset mapping
export const HUB_LEVELS = {
  1: {
    name: 'Tide Hut',
    image: '/assets/hubs/level_1.webp',
  },
  2: {
    name: 'Wave Dock',
    image: '/assets/hubs/level_2.webp',
  },
  3: {
    name: 'Aqua Bastion',
    image: '/assets/hubs/level_3.webp',
  },
  4: {
    name: 'Ocean Citadel',
    image: '/assets/hubs/level_4.webp',
  },
  5: {
    name: "Poseidon's Hub",
    image: '/assets/hubs/level_5.webp',
  },
};

export function getHubImagePath(level) {
  const safeLevel = Math.min(Math.max(level, 1), 5);
  return HUB_LEVELS[safeLevel].image;
}

export function getHubName(level) {
  const safeLevel = Math.min(Math.max(level, 1), 5);
  return HUB_LEVELS[safeLevel].name;
}