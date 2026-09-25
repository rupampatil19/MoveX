import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Renders Maharashtra state outline + a Pune click marker.
 * Filters the same states GeoJSON by name === "Maharashtra".
 */
const MaharashtraLayer = ({ onCityClick }) => {
  const map = useMap();
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/geojson/india-states.geojson')
      .then((r) => (r.ok ? r.json() : Promise.reject('load failed')))
      .then(setGeoData)
      .catch((err) => console.error('MaharashtraLayer:', err));
  }, []);

  useEffect(() => {
    if (!geoData) return;

    const mh = geoData.features.find((f) => {
      const n =
        f.properties?.NAME_1 ||
        f.properties?.ST_NM ||
        f.properties?.name ||
        '';
      return n.toLowerCase() === 'maharashtra';
    });

    if (!mh) {
      console.warn('MaharashtraLayer: Maharashtra feature not found');
      return;
    }

    const stateLayer = L.geoJSON(mh, {
      style: {
        color: '#2563EB',
        weight: 2,
        fillColor: '#2563EB',
        fillOpacity: 0.15,
      },
    }).addTo(map);

    const puneMarker = L.circleMarker([18.5204, 73.8567], {
      radius: 12,
      color: '#2563EB',
      fillColor: '#2563EB',
      fillOpacity: 0.9,
      weight: 2,
    })
      .addTo(map)
      .bindTooltip('Pune — Click to zoom in', { permanent: false });

    puneMarker.on('click', () => onCityClick?.('Pune'));

    return () => {
      stateLayer.remove();
      puneMarker.remove();
    };
  }, [geoData, map, onCityClick]);

  return null;
};

export default MaharashtraLayer;