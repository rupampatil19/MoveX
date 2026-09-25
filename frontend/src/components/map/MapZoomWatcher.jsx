import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Watches the Leaflet map zoom and calls onZoomChange(z) on every zoom event.
 * Must be rendered INSIDE <MapContainer>.
 */
const MapZoomWatcher = ({ onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    const handler = () => onZoomChange(map.getZoom());
    handler(); // fire once so parent has the initial zoom
    map.on('zoomend', handler);
    return () => map.off('zoomend', handler);
  }, [map, onZoomChange]);

  return null;
};

export default MapZoomWatcher;