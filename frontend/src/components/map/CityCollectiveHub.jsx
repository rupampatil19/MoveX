import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getHubImagePath, getHubName, getCityLevel } from '../../data/regionConfig';

/**
 * Big city-level Hub marker. Size configurable so the same component
 * works on both the full Map tab and the compact Dashboard map.
 */
const CityCollectiveHub = ({ city, totalEnergy, size = 96, onClick }) => {
  const map = useMap();

  useEffect(() => {
    if (!city || totalEnergy == null) return;

    const level = getCityLevel(totalEnergy);
    const imagePath = getHubImagePath(level);
    const hubName = getHubName(level);

    const borderW = size >= 80 ? 3 : 2;
    const glow = size >= 80 ? 24 : 12;
    const anchor = size / 2;

    const icon = L.divIcon({
      className: 'city-collective-hub',
      html: `
        <div style="
          width: ${size}px; height: ${size}px; border-radius: 50%; overflow: hidden;
          border: ${borderW}px solid #00CFFF;
          box-shadow: 0 0 ${glow}px rgba(0,207,255,${size >= 80 ? 0.75 : 0.6});
          display: flex; align-items: center; justify-content: center;
          background: rgba(11,31,42,0.4);
        ">
          <img
            src="${imagePath}"
            style="width:100%; height:100%; object-fit:cover;"
            alt="${city.name} Hub"
          />
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [anchor, anchor],
      tooltipAnchor: [0, -anchor],
    });

    const marker = L.marker(city.stationPosition || city.center, { icon })
      .addTo(map)
      .bindTooltip(
        `${city.name} Energy Hub — ${hubName} (Level ${level})`,
        { direction: 'top', offset: [0, -anchor], opacity: 1 }
      );

    marker.on('click', () => {
      onClick?.({ city, level, hubName, imagePath, totalEnergy });
    });

    return () => marker.remove();
  }, [city, totalEnergy, size, map, onClick]);

  return null;
};

export default CityCollectiveHub;