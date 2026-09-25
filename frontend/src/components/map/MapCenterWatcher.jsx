import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const MapCenterWatcher = ({ onChange }) => {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      const c = map.getCenter();
      onChange([c.lat, c.lng]);
    };
    handler();
    map.on('moveend', handler);
    return () => map.off('moveend', handler);
  }, [map, onChange]);
  return null;
};

export default MapCenterWatcher;