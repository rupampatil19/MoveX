import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { PUNE_REGIONS, getRegionLevel, getBuildingName, getBuildingEmoji } from '../data/regionConfig';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom small building icon
function createBuildingIcon(emoji) {
  return L.divIcon({
    className: 'building-marker',
    html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(0,0,0,0.55);border-radius:50%;border:2px solid #2563EB;box-shadow:0 0 8px rgba(37,99,235,0.5);">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const MiniMap = () => {
  const [regionData, setRegionData] = useState([]);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await fetch('/api/community/all');
        if (res.ok) {
          const data = await res.json();
          setRegionData(data);
        }
      } catch (err) {
        console.error('MiniMap fetch error:', err);
      }
    };
    fetchRegions();
  }, []);

  const getRegionEnergy = (regionId) => {
    const data = regionData.find(r => r.region === regionId);
    return data?.totalEnergy || 0;
  };

  return (
    <div className="relative h-48 w-full">
      <MapContainer center={[18.56, 73.85]} zoom={11} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Draw semi-transparent circles around each region center */}
        {PUNE_REGIONS.map(region => (
          <CircleMarker
            key={region.id}
            center={region.center}
            pathOptions={{
              color: region.color,
              fillColor: region.color,
              fillOpacity: 0.2,
              radius: 800,
            }}
          />
        ))}

        {/* Building markers */}
        {PUNE_REGIONS.map(region => {
          const energy = getRegionEnergy(region.id);
          const level = getRegionLevel(energy);
          const buildingName = getBuildingName(energy);
          const buildingEmoji = getBuildingEmoji(energy);
          return (
            <Marker key={region.id} position={region.center} icon={createBuildingIcon(buildingEmoji)}>
              <Tooltip direction="top" offset={[0, -15]} opacity={1}>
                <span className="font-semibold">{region.id}</span><br />
                <span>Level {level} — {buildingName}</span>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      <Link
        to="/map"
        className="absolute bottom-2 right-2 bg-white/90 backdrop-blur text-[#2563EB] text-xs font-semibold px-3 py-1 rounded-full shadow"
      >
        View Full Map
      </Link>
    </div>
  );
};

export default MiniMap;