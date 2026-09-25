// ============================================================
// MOVEX NATIONAL GEOGRAPHIC CONFIG
// ============================================================
// Static configuration for India → State → City → Region.
// ============================================================

import { PUNE_REGIONS } from './regionConfig';

// ------------------------------------------------------------
// COUNTRIES
// ------------------------------------------------------------
export const COUNTRIES = {
  IN: { id: 'IN', name: 'India', center: [22.0, 79.0], defaultZoom: 5 },
};

// ------------------------------------------------------------
// STATES / UTs
// ------------------------------------------------------------
export const STATES = {
  MH: {
    id: 'MH',
    name: 'Maharashtra',
    countryId: 'IN',
    center: [19.75, 75.7],
    defaultZoom: 7,
  },
  KA: {
    id: 'KA',
    name: 'Karnataka',
    countryId: 'IN',
    center: [15.3173, 75.7139],
    defaultZoom: 7,
  },
};

// ------------------------------------------------------------
// REGIONS — Pune imports from regionConfig, others defined here
// ------------------------------------------------------------
export const PUNE_REGIONS_LIST = PUNE_REGIONS;

export const BENGALURU_REGIONS = [
  { id: 'Koramangala',  center: [12.9352, 77.6245], color: '#4CAF50' },
  { id: 'Whitefield',   center: [12.9698, 77.7500], color: '#2196F3' },
  { id: 'Indiranagar',  center: [12.9719, 77.6412], color: '#9C27B0' },
  { id: 'HSR Layout',   center: [12.9116, 77.6389], color: '#FF9800' },
  { id: 'Jayanagar',    center: [12.9250, 77.5938], color: '#E91E63' },
];

// ------------------------------------------------------------
// CITIES
// ------------------------------------------------------------
export const CITIES = {
  pune: {
    id: 'pune',
    name: 'Pune',
    stateId: 'MH',
    countryId: 'IN',
    center: [18.56, 73.85],
    defaultZoom: 12,
    stationPosition: [18.5204, 73.8567],
    regionIds: PUNE_REGIONS_LIST.map((r) => r.id),
    status: 'active',
  },
  bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru',
    stateId: 'KA',
    countryId: 'IN',
    center: [12.9716, 77.5946],
    defaultZoom: 11,
    stationPosition: [12.9716, 77.5946],
    regionIds: BENGALURU_REGIONS.map((r) => r.id),
    status: 'active',
  },
};

// ------------------------------------------------------------
// FLAT REGIONS MAP — all regions with hierarchy metadata
// ------------------------------------------------------------
export const REGIONS = {};

PUNE_REGIONS_LIST.forEach((r) => {
  REGIONS[r.id] = {
    ...r,
    cityId: 'pune',
    stateId: 'MH',
    countryId: 'IN',
    compositeKey: `IN:MH:pune:${r.id}`,
  };
});

BENGALURU_REGIONS.forEach((r) => {
  REGIONS[r.id] = {
    ...r,
    cityId: 'bengaluru',
    stateId: 'KA',
    countryId: 'IN',
    compositeKey: `IN:KA:bengaluru:${r.id}`,
  };
});

// ------------------------------------------------------------
// LOOKUP HELPERS
// ------------------------------------------------------------
export function getStateForCity(cityId) {
  const city = CITIES[cityId];
  return city ? STATES[city.stateId] || null : null;
}

export function getCityForRegion(regionId) {
  const region = REGIONS[regionId];
  return region ? CITIES[region.cityId] || null : null;
}

export function getStateForRegion(regionId) {
  const region = REGIONS[regionId];
  return region ? STATES[region.stateId] || null : null;
}

export function getRegionsForCity(cityId) {
  return Object.values(REGIONS).filter((r) => r.cityId === cityId);
}

export function getCitiesForState(stateId) {
  return Object.values(CITIES).filter((c) => c.stateId === stateId);
}

export function buildRegionKey(regionId) {
  const r = REGIONS[regionId];
  return r?.compositeKey || null;
}

export function parseRegionKey(key) {
  const [countryId, stateId, cityId, ...rest] = key.split(':');
  return { countryId, stateId, cityId, regionId: rest.join(':') };
}