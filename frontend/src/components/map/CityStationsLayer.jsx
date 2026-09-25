import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCityLevel, getHubImagePath, getHubName } from '../../data/regionConfig';

/**
 * Renders a City Energy Hub marker for each city.
 * Uses the real level 1–5 Hub WebP image based on the city's
 * aggregated energy, with an optional city name label.
 */
const CityStationsLayer = ({
  cities,
  cityEnergies = {},
  onCityClick,
  size = 40,
  showLabels = true,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!cities) return;

    const markers = [];

    Object.values(cities).forEach((city) => {
      const pos = city.stationPosition || city.center;
      const energy = cityEnergies[city.id] || 0;
      const level = getCityLevel(energy);
      const imagePath = getHubImagePath(level);
      const hubName = getHubName(level);

      const labelHtml = showLabels
        ? `<span style="
              margin-top:3px;
              font-size:10px;
              font-weight:600;
              color:#1e293b;
              background:rgba(255,255,255,0.95);
              padding:1px 5px;
              border-radius:4px;
              white-space:nowrap;
              box-shadow:0 1px 3px rgba(0,0,0,0.12);
            ">${city.name}</span>`
        : '';

      const totalW = size + 60;
      const totalH = size + (showLabels ? 18 : 0);

      const icon = L.divIcon({
        className: 'city-hub-marker',
        html: `
          <div style="
            display:flex;
            flex-direction:column;
            align-items:center;
            cursor:pointer;
          ">
            <div style="
              width:${size}px;
              height:${size}px;
              border-radius:50%;
              overflow:hidden;
              border:2px solid #00CFFF;
              box-shadow:0 0 10px rgba(0,207,255,0.7), 0 0 4px rgba(0,207,255,0.5);
              background:rgba(11,31,42,0.4);
            ">
              <img
                src="${imagePath}"
                style="width:100%;height:100%;object-fit:cover;"
                alt="${city.name} Hub"
              />
            </div>
            ${labelHtml}
          </div>
        `,
        iconSize: [totalW, totalH],
        iconAnchor: [totalW / 2, size / 2],
        tooltipAnchor: [0, -size / 2],
      });

      const marker = L.marker(pos, { icon })
        .addTo(map)
        .bindTooltip(
          `${city.name} — ${hubName} (Level ${level}) · ${energy.toLocaleString()} energy`,
          { direction: 'top', offset: [0, -size / 2], opacity: 1 }
        );

      marker.on('click', () => onCityClick?.(city.id));
      markers.push(marker);
    });

    return () => markers.forEach((m) => m.remove());
  }, [cities, cityEnergies, size, showLabels, map, onCityClick]);

  return null;
};

export default CityStationsLayer;