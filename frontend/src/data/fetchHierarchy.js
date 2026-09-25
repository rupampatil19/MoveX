import API from '../api';

/**
 * Fetch the full State → City → Region hierarchy from the backend.
 * Falls back to the local static copy if the API is unreachable.
 */
export async function fetchGeoHierarchy() {
  try {
    const res = await API.get('/geo/hierarchy');
    return res.data;
  } catch (err) {
    console.warn('Failed to fetch hierarchy from API, using local fallback', err);
    const local = await import('./geoHierarchy');
    return {
      country: { id: 'IN', name: 'India' },
      states: local.STATES,
      cities: local.CITIES.map((c) => ({
        id: c.id,
        name: c.name,
        stateId: c.stateId,
      })),
      regions: local.CITIES.reduce((acc, c) => {
        acc[c.id] = local.getRegionsForCity(c.id);
        return acc;
      }, {}),
    };
  }
}