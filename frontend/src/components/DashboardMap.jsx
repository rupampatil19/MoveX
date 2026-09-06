import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { PUNE_REGIONS, getRegionLevel, getBuildingName, getBuildingEmoji } from '../data/regionConfig';
import API from '../api';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icon (not used for hubs)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Projection helpers (same as MapPage)
const CENTER = { lat: 18.56, lng: 73.85 };
function project(lat, lng) {
  return { x: (lng - CENTER.lng) * Math.cos(CENTER.lat * Math.PI / 180), y: lat - CENTER.lat };
}
function unproject(x, y) {
  return [y + CENTER.lat, x / Math.cos(CENTER.lat * Math.PI / 180) + CENTER.lng];
}
function angleOf(lat, lng) {
  const p = project(lat, lng);
  return Math.atan2(p.y, p.x);
}
function midAngle(a, b) {
  let diff = b - a;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  return a + diff / 2;
}

// Generate non-overlapping wavy radial sectors (same as MapPage)
function generateRegionPolygons() {
  const sortedIndices = [...PUNE_REGIONS.keys()].sort((i, j) => {
    const r1 = PUNE_REGIONS[i];
    const r2 = PUNE_REGIONS[j];
    return angleOf(r1.center[0], r1.center[1]) - angleOf(r2.center[0], r2.center[1]);
  });
  const n = sortedIndices.length;
  const polygons = {};
  const OUTER_RADIUS = 0.15;

  for (let k = 0; k < n; k++) {
    const region = PUNE_REGIONS[sortedIndices[k]];
    const prevRegion = PUNE_REGIONS[sortedIndices[(k - 1 + n) % n]];
    const nextRegion = PUNE_REGIONS[sortedIndices[(k + 1) % n]];

    const currAngle = angleOf(region.center[0], region.center[1]);
    const prevAngle = angleOf(prevRegion.center[0], prevRegion.center[1]);
    const nextAngle = angleOf(nextRegion.center[0], nextRegion.center[1]);

    const startAngle = midAngle(prevAngle, currAngle);
    const endAngle = midAngle(currAngle, nextAngle);

    let sectorStart = startAngle;
    let sectorEnd = endAngle;
    if (sectorEnd < sectorStart) sectorEnd += 2 * Math.PI;

    const steps = 10;
    const arcSteps = 20;
    const points = [];
    points.push([CENTER.lat, CENTER.lng]);

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const r = OUTER_RADIUS * t;
      const wave = Math.sin(t * Math.PI * 3) * 0.006;
      const perpAngle = sectorStart + Math.PI / 2;
      const x = Math.cos(sectorStart) * r + Math.cos(perpAngle) * wave;
      const y = Math.sin(sectorStart) * r + Math.sin(perpAngle) * wave;
      points.push(unproject(x, y));
    }

    for (let s = 1; s < arcSteps; s++) {
      const t = s / arcSteps;
      const angle = sectorStart + (sectorEnd - sectorStart) * t;
      const outerWave = Math.sin(t * Math.PI * 5) * 0.005;
      const r = OUTER_RADIUS + outerWave;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      points.push(unproject(x, y));
    }

    for (let s = steps; s >= 0; s--) {
      const t = s / steps;
      const r = OUTER_RADIUS * t;
      const wave = Math.sin(t * Math.PI * 3 + 1) * 0.006;
      const perpAngle = sectorEnd + Math.PI / 2;
      const x = Math.cos(sectorEnd) * r + Math.cos(perpAngle) * wave;
      const y = Math.sin(sectorEnd) * r + Math.sin(perpAngle) * wave;
      points.push(unproject(x, y));
    }

    polygons[region.id] = points;
  }

  return polygons;
}

// Building icon identical to MapPage
function createBuildingIcon(emoji) {
  return L.divIcon({
    className: 'building-marker',
    html: `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:30px;background:rgba(0,0,0,0.55);border-radius:50%;border:2px solid #00CFFF;box-shadow:0 0 12px rgba(0,207,255,0.6);">${emoji}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    tooltipAnchor: [0, -22],
  });
}

const DashboardMap = ({ userRegion }) => {
  const [regionData, setRegionData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Use the same dynamic polygon generator as MapPage
  const regionPolygons = useMemo(() => generateRegionPolygons(), []);

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
    const buildingName = getBuildingName(energy);
    const buildingEmoji = getBuildingEmoji(energy);
    setSelectedRegion({ ...region, energy, level, buildingName, buildingEmoji });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-[300px] mx-auto md:mx-0">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Pune Map</h2>
        <Link to="/map" className="text-[#2563EB] text-xs font-medium hover:text-[#1D4ED8]">
          View Full Map →
        </Link>
      </div>

      {/* Small square map tile - identical regions as MapPage */}
      <div className="relative w-full aspect-square">
        <MapContainer center={[18.56, 73.85]} zoom={12} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {PUNE_REGIONS.map(region => {
            const polygonCoords = regionPolygons[region.id];
            if (!polygonCoords || polygonCoords.length < 3) return null;

            const energy = getRegionEnergy(region.id);
            const level = getRegionLevel(energy);
            const buildingName = getBuildingName(energy);
            const buildingEmoji = getBuildingEmoji(energy);
            const isUserRegion = userRegion === region.id;
            const isSelected = selectedRegion?.id === region.id;
            const color = region.color;

            return (
              <div key={region.id}>
                <Polygon
                  positions={polygonCoords}
                  pathOptions={{
                    color: isUserRegion ? '#2563EB' : color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.4 : isUserRegion ? 0.3 : 0.2,
                    weight: isSelected || isUserRegion ? 3 : 2,
                  }}
                  eventHandlers={{
                    click: () => handleRegionClick(region),
                  }}
                />
                <Marker
                  position={region.center}
                  icon={createBuildingIcon(buildingEmoji)}
                  eventHandlers={{
                    click: () => handleRegionClick(region),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -22]} opacity={1}>
                    <span className="font-semibold">{region.id}</span><br />
                    <span>Level {level} — {buildingName}</span>
                  </Tooltip>
                </Marker>
              </div>
            );
          })}
        </MapContainer>

        {/* Selected region mini info */}
        {selectedRegion && (
          <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur rounded-lg p-2 shadow text-xs max-w-[180px] z-[500]">
            <p className="font-semibold text-gray-800">{selectedRegion.id}</p>
            <p className="text-[#2563EB]">
              {selectedRegion.buildingEmoji} {selectedRegion.buildingName} • L{selectedRegion.level}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMap;