import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getHubImagePath, getHubName, getStateLevel } from '../../data/regionConfig';

/**
 * Renders one Hub image marker per state.
 * Size is configurable so the same layer works at India zoom (small)
 * and at State zoom (large).
 */
const StateHubsLayer = ({ states, stateEnergies, size = 56, onStateClick }) => {
  const map = useMap();

  useEffect(() => {
    if (!states) return;

    const markers = [];

    Object.values(states).forEach((state) => {
      const energy = stateEnergies?.[state.id] || 0;
      const level = getStateLevel(energy);
      const imagePath = getHubImagePath(level);
      const hubName = getHubName(level);

      const borderW = size >= 90 ? 3 : 2;
      const glow = size >= 90 ? 24 : 10;
      const anchor = size / 2;

      const icon = L.divIcon({
        className: 'state-hub',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            overflow: hidden;
            border: ${borderW}px solid #00CFFF;
            box-shadow: 0 0 ${glow}px rgba(0,207,255,${size >= 90 ? 0.75 : 0.5});
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(11,31,42,0.4);
          ">
            <img
              src="${imagePath}"
              style="width:100%; height:100%; object-fit:cover;"
              alt="${state.name} Hub"
            />
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [anchor, anchor],
        tooltipAnchor: [0, -anchor],
      });

      const marker = L.marker(state.stationPosition, { icon })
        .addTo(map)
        .bindTooltip(
          `${state.name} — ${hubName} (Level ${level})`,
          { direction: 'top', offset: [0, -anchor], opacity: 1 }
        );

      marker.on('click', () => onStateClick?.(state.id));
      markers.push(marker);
    });

    return () => markers.forEach((m) => m.remove());
  }, [states, stateEnergies, size, map, onStateClick]);

  return null;
};

export default StateHubsLayer;