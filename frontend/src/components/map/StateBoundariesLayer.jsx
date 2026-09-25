import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Renders ALL Indian state boundaries as subtle gray outlines.
 * Visible at every zoom level — India, State, City, Region.
 *
 * Uses a dedicated Leaflet pane (zIndex 450) so the borders sit
 * above fills/polygons (400) but below hub markers (600).
 */
const StateBoundariesLayer = () => {
  const map = useMap();
  const [geoData, setGeoData] = useState(null);

  // Create a dedicated pane between overlay and marker layers
  useEffect(() => {
    if (!map.getPane('stateBoundariesPane')) {
      const pane = map.createPane('stateBoundariesPane');
      pane.style.zIndex = '450';
      pane.style.pointerEvents = 'none';
    }
  }, [map]);

  // Load GeoJSON once
  useEffect(() => {
    fetch('/geojson/india-states.geojson')
      .then((r) => {
        if (!r.ok) throw new Error('GeoJSON load failed: ' + r.status);
        return r.json();
      })
      .then(setGeoData)
      .catch((err) => console.error('StateBoundariesLayer:', err));
  }, []);

  // Render the boundary layer
  useEffect(() => {
    if (!geoData) return;

    const layer = L.geoJSON(geoData, {
      pane: 'stateBoundariesPane',
      interactive: false,
      style: {
        color: '#94A3B8',   // soft gray — muted slate
        weight: 0.9,        // thin
        opacity: 0.55,      // subtle
        fillOpacity: 0,     // no fill — just outline
      },
    }).addTo(map);

    return () => layer.remove();
  }, [geoData, map]);

  return null;
};

export default StateBoundariesLayer;