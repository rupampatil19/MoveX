import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Draws India's OUTER national boundary as a bold black line.
 *
 * Loads Natural Earth's countries GeoJSON from /geojson/countries.geojson,
 * extracts only the India feature, and renders its boundary on a dedicated
 * pane above the state fills.
 */
const IndiaOutlineLayer = () => {
  const map = useMap();
  const [outline, setOutline] = useState(null);

  // Create a high z-index pane — above state fills (400), below markers (600)
  useEffect(() => {
    if (!map.getPane('indiaOutlinePane')) {
      const pane = map.createPane('indiaOutlinePane');
      pane.style.zIndex = '465';
      pane.style.pointerEvents = 'none';
    }
  }, [map]);

  // Fetch countries GeoJSON + extract India
  useEffect(() => {
    let cancelled = false;

    fetch('/geojson/countries.geojson')
      .then((r) => {
        if (!r.ok) throw new Error('countries.geojson missing: ' + r.status);
        return r.json();
      })
      .then((geo) => {
        if (cancelled) return;
        const india = geo.features?.find(
          (f) =>
            f.properties?.ADMIN === 'India' ||
            f.properties?.NAME === 'India' ||
            f.properties?.name === 'India'
        );
        if (!india) throw new Error('India feature not found in GeoJSON');
        console.log('IndiaOutlineLayer: ✓ India boundary loaded');
        setOutline(india);
      })
      .catch((e) => console.warn('IndiaOutlineLayer:', e.message));

    return () => { cancelled = true; };
  }, []);

  // Draw the outline
  useEffect(() => {
    if (!outline) return;

    const layer = L.geoJSON(outline, {
      pane: 'indiaOutlinePane',
      interactive: false,
      style: {
        color: '#000000',   // solid black
        weight: 1,        // bold
        opacity: 1,
        fill: false,        // no fill — outline only
        lineCap: 'round',
        lineJoin: 'round',
      },
    }).addTo(map);

    console.log('IndiaOutlineLayer: ✓ drawn on map');

    return () => layer.remove();
  }, [outline, map]);

  return null;
};

export default IndiaOutlineLayer;