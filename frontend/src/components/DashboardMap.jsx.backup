import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { PUNE_REGIONS, getRegionLevel, getHubImagePath, getHubName } from '../data/regionConfig';
import { generateRegionPolygons, calculateCentroid } from '../utils/regionUtils';
import API from '../api';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function createHubIcon(imagePath) {
  return L.divIcon({
    className: 'hub-marker',
    html: `
      <div style="
        width: 50px;
        height: 50px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid #00CFFF;
        box-shadow: 0 0 6px rgba(0,207,255,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
      ">
        <img src="${imagePath}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    tooltipAnchor: [0, -25],
  });
}

const DashboardMap = ({ userRegion }) => {
  const [regionData, setRegionData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);

  const regionPolygons = useMemo(() => generateRegionPolygons(PUNE_REGIONS), []);
  const centroidCache = useMemo(() => {
    const cache = {};
    Object.entries(regionPolygons).forEach(([id, coords]) => {
      cache[id] = calculateCentroid(coords);
    });
    return cache;
  }, [regionPolygons]);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const res = await API.get('/community/all');
      setRegionData(res.data);
    } catch (err) {
      console.error('DashboardMap fetch error:', err);
    }
  };

  const getRegionEnergy = (regionId) => {
    const data = regionData.find(r => r.region === regionId);
    return data?.totalEnergy || 0;
  };

  const handleRegionClick = (region) => {
    const energy = getRegionEnergy(region.id);
    const level = getRegionLevel(energy);
    const hubName = getHubName(level);
    const hubImage = getHubImagePath(level);
    setSelectedRegion({ ...region, energy, level, hubName, hubImage });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-[300px] mx-auto md:mx-0">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Pune Map</h2>
        <Link to="/map" className="text-[#2563EB] text-xs font-medium">View Full Map →</Link>
      </div>

      <div className="relative w-full aspect-square">
        <MapContainer center={[18.56, 73.85]} zoom={12} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {PUNE_REGIONS.map(region => {
            const polygonCoords = regionPolygons[region.id];
            if (!polygonCoords || polygonCoords.length < 3) return null;

            const energy = getRegionEnergy(region.id);
            const level = getRegionLevel(energy);
            const hubImage = getHubImagePath(level);
            const hubName = getHubName(level);
            const isUserRegion = userRegion === region.id;
            const hubPosition = centroidCache[region.id];

            return (
              <div key={region.id}>
                <Polygon
                  positions={polygonCoords}
                  pathOptions={{
                    color: isUserRegion ? '#2563EB' : region.color,
                    fillColor: region.color,
                    fillOpacity: isUserRegion ? 0.35 : 0.15,
                    weight: isUserRegion ? 3 : 2,
                  }}
                  eventHandlers={{ click: () => handleRegionClick(region) }}
                />
                <Marker
                  position={hubPosition}
                  icon={createHubIcon(hubImage)}
                  eventHandlers={{ click: () => handleRegionClick(region) }}
                >
                  <Tooltip>
                    <span>{region.id}</span><br />
                    <span>Level {level} — {hubName}</span>
                  </Tooltip>
                </Marker>
              </div>
            );
          })}
        </MapContainer>

        {selectedRegion && (
          <div className="absolute bottom-2 left-2 bg-white/95 rounded-lg p-2 shadow text-xs max-w-[180px] z-[500] flex items-center gap-2">
            <img
              src={selectedRegion.hubImage}
              alt={selectedRegion.hubName}
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <p className="font-semibold">{selectedRegion.id}</p>
              <p className="text-[#2563EB]">{selectedRegion.hubName} • L{selectedRegion.level}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMap;