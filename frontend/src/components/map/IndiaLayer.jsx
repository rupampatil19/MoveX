import { useEffect, useState, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// ============================================================
// STATE COLOR PALETTE
// ============================================================
// Slot 0 (#2563EB) is RESERVED for the user's own state.
// The rest are distinct, moderately saturated, MoveX-friendly.
// ============================================================
const USER_STATE_COLOR = '#2563EB';

const PALETTE = [
  USER_STATE_COLOR, // 0 — reserved, not used by hash
  '#0891B2', // cyan
  '#0D9488', // teal
  '#059669', // emerald
  '#16A34A', // green
  '#65A30D', // lime
  '#CA8A04', // yellow
  '#EA580C', // orange
  '#DC2626', // red
  '#DB2777', // pink
  '#C026D3', // fuchsia
  '#9333EA', // purple
  '#7C3AED', // violet
  '#4F46E5', // indigo
  '#0284C7', // sky
  '#0369A1', // darker sky
  '#155E75', // dark cyan
  '#166534', // dark green
  '#9F1239', // rose
  '#6D28D9', // dark violet
];

// Deterministic hash — same state always yields same index
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getStateColor(stateName, userState) {
  if (!stateName) return '#94A3B8';
  if (userState && stateName.toLowerCase() === userState.toLowerCase()) {
    return USER_STATE_COLOR;
  }
  // Skip slot 0 (reserved for user state)
  const idx = 1 + (hashCode(stateName) % (PALETTE.length - 1));
  return PALETTE[idx];
}

// ============================================================
// COMPONENT
// ============================================================
const IndiaLayer = ({ stateEnergies = {}, userState = null, onStateClick }) => {
  const map = useMap();
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/geojson/india-states.geojson')
      .then((r) => {
        if (!r.ok) throw new Error('GeoJSON load failed: ' + r.status);
        return r.json();
      })
      .then(setGeoData)
      .catch((err) => console.error('IndiaLayer:', err));
  }, []);

  const maxEnergy = useMemo(() => {
    const values = Object.values(stateEnergies).filter((v) => typeof v === 'number');
    return Math.max(1, ...values);
  }, [stateEnergies]);

  const getStateName = (feature) =>
    feature.properties?.NAME_1 ||
    feature.properties?.ST_NM ||
    feature.properties?.name ||
    'Unknown';

  const getIntensity = (name) => {
    const e = stateEnergies[name] || 0;
    return Math.min(1, e / maxEnergy);
  };

  const buildStyle = (name, isHover = false) => {
    const baseColor = getStateColor(name, userState);
    const intensity = getIntensity(name);
    // Opacity: 0.35 (empty) → 0.75 (top). All states visible.
    const fillOpacity = (isHover ? 0.15 : 0) + 0.35 + intensity * 0.4;
    return {
      color: baseColor,
      weight: isHover ? 3 : intensity > 0.5 ? 2.2 : 1.2,
      fillColor: baseColor,
      fillOpacity: isHover ? Math.min(0.9, fillOpacity + 0.15) : fillOpacity,
      opacity: isHover ? 1 : 0.85,
    };
  };

  useEffect(() => {
    if (!geoData) return;

    const layer = L.geoJSON(geoData, {
      style: (feature) => buildStyle(getStateName(feature), false),
      onEachFeature: (feature, lyr) => {
        const name = getStateName(feature);
        const energy = stateEnergies[name] || 0;
        const isUserState = userState && name.toLowerCase() === userState.toLowerCase();

        lyr.on({
          mouseover: (e) => {
            e.target.setStyle(buildStyle(name, true));
            e.target.bringToFront();
          },
          mouseout: (e) => {
            e.target.setStyle(buildStyle(name, false));
          },
          click: () => onStateClick?.(name),
        });

        lyr.bindTooltip(
          `<div style="text-align:center;">
            <div style="font-weight:600;color:#1e293b;">${name}${isUserState ? ' ★' : ''}</div>
            <div style="font-size:11px;color:#64748b;">${energy.toLocaleString()} energy</div>
          </div>`,
          { sticky: true, opacity: 1, className: 'state-tip' }
        );
      },
    }).addTo(map);

    return () => layer.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoData, map, onStateClick, maxEnergy, stateEnergies, userState]);

  return null;
};

export default IndiaLayer;