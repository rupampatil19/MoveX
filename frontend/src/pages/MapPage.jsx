import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { PUNE_REGIONS, getRegionLevel, getBuildingName, getBuildingEmoji } from '../data/regionConfig';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function createBuildingIcon(emoji) {
  return L.divIcon({
    className: 'building-marker',
    html: `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:30px;background:rgba(0,0,0,0.55);border-radius:50%;border:2px solid #00CFFF;box-shadow:0 0 12px rgba(0,207,255,0.6);">${emoji}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    tooltipAnchor: [0, -22],
  });
}

// Projection helper (small area)
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
// Average of two angles, handling circularity
function midAngle(a, b) {
  let diff = b - a;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  return a + diff / 2;
}

// Generate non-overlapping wavy radial sectors.
// The angular divisions are based on bisectors of adjacent region center angles,
// ensuring shared radial boundaries and no overlaps.
function generateRegionPolygons() {
  // Sort region indices by angle around central point
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

    // Shared boundary angles (bisectors)
    const startAngle = midAngle(prevAngle, currAngle);
    const endAngle = midAngle(currAngle, nextAngle);

    // Ensure proper angular ordering and handle wrap-around
    let sectorStart = startAngle;
    let sectorEnd = endAngle;
    if (sectorEnd < sectorStart) sectorEnd += 2 * Math.PI;

    const steps = 10;
    const arcSteps = 20;
    const points = [];

    // Center point
    points.push([CENTER.lat, CENTER.lng]);

    // Wavy radial line from center to outer boundary at sectorStart
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const r = OUTER_RADIUS * t;
      const wave = Math.sin(t * Math.PI * 3) * 0.006;
      const perpAngle = sectorStart + Math.PI / 2;
      const x = Math.cos(sectorStart) * r + Math.cos(perpAngle) * wave;
      const y = Math.sin(sectorStart) * r + Math.sin(perpAngle) * wave;
      points.push(unproject(x, y));
    }

    // Outer arc from sectorStart to sectorEnd with waviness
    for (let s = 1; s < arcSteps; s++) {
      const t = s / arcSteps;
      const angle = sectorStart + (sectorEnd - sectorStart) * t;
      const outerWave = Math.sin(t * Math.PI * 5) * 0.005;
      const r = OUTER_RADIUS + outerWave;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      points.push(unproject(x, y));
    }

    // Wavy radial line from outer boundary back to center at sectorEnd
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

const MapPage = () => {
  const [regionData, setRegionData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  const regionPolygons = useMemo(() => generateRegionPolygons(), []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {}, () => {});
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const res = await API.get('/community/all');
      setRegionData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      const fallback = PUNE_REGIONS.map(r => ({
        region: r.id,
        totalEnergy: 0,
        powerStationLevel: 1,
        powerStationCurrentEnergy: 0,
        powerStationRequiredEnergy: 20000,
      }));
      setRegionData(fallback);
      setLoading(false);
    }
  };

  const getRegionEnergy = (regionId) => {
    const data = regionData.find(r => r.region === regionId);
    return data?.totalEnergy || 0;
  };

  if (loading) return <div className="p-6 text-gray-700">Loading map...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h1 className="text-3xl font-bold text-gray-800">Pune Living Map</h1>
      <p className="text-gray-500">Seven connected regions covering the full MoveX Pune area.</p>

      <div className="h-[75vh] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative">
        <MapContainer center={[18.56, 73.85]} zoom={12} style={{ height: '100%', width: '100%' }}>
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
            const isSelected = selectedRegion?.id === region.id;

            return (
              <div key={region.id}>
                <Polygon
                  positions={polygonCoords}
                  pathOptions={{
                    color: region.color,
                    fillColor: region.color,
                    fillOpacity: isSelected ? 0.4 : 0.2,
                    weight: isSelected ? 3 : 2,
                  }}
                  eventHandlers={{
                    click: () => setSelectedRegion({ ...region, energy, level, buildingName, buildingEmoji }),
                  }}
                />
                <Marker
                  position={region.center}
                  icon={createBuildingIcon(buildingEmoji)}
                  eventHandlers={{
                    click: () => setSelectedRegion({ ...region, energy, level, buildingName, buildingEmoji }),
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

        {/* Region Details Panel (bottom-left) */}
        <div className="absolute bottom-4 left-4 bg-[#0B1F2A]/95 backdrop-blur text-white rounded-2xl p-4 shadow-xl w-72 md:w-80 max-h-[60vh] overflow-y-auto z-[1000]">
          {selectedRegion ? (
            <>
              <h2 className="text-xl font-bold text-white">{selectedRegion.id}</h2>
              <p className="text-sm text-[#7DD3FC] flex items-center gap-1 mt-1">
                {selectedRegion.buildingEmoji} {selectedRegion.buildingName} • Level {selectedRegion.level}
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Regional Energy</span>
                  <span className="font-medium text-white">
                    {selectedRegion.energy.toLocaleString()} / {selectedRegion.level >= 5 ? 'Max' : 20000 * selectedRegion.level}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#20C9A6] h-2 rounded-full"
                    style={{
                      width: `${selectedRegion.level >= 5 ? 100 : Math.min((selectedRegion.energy / (20000 * selectedRegion.level)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Progress</span>
                  <span className="text-white">
                    {selectedRegion.level >= 5 ? 'Max' : `${Math.min((selectedRegion.energy / (20000 * selectedRegion.level)) * 100, 100).toFixed(1)}%`}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to="/leaderboard" className="flex-1 bg-[#188AD8] text-white text-center py-2 rounded-lg hover:bg-[#1a9ae0]">
                  View Leaderboard
                </Link>
                <Link to="/quests" className="flex-1 bg-[#20C9A6] text-white text-center py-2 rounded-lg hover:bg-[#1ab897]">
                  Challenges
                </Link>
              </div>
            </>
          ) : (
            <p className="text-gray-300">Select a region to see details.</p>
          )}
        </div>

        {/* Legend Panel (bottom-right) */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg text-sm max-w-xs z-[1000]">
          <h3 className="font-semibold text-gray-800 mb-1">Regions</h3>
          <ul className="space-y-1">
            {PUNE_REGIONS.map(r => (
              <li key={r.id} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }}></span>
                <span className="text-gray-700">{r.id}</span>
              </li>
            ))}
          </ul>
          <h3 className="font-semibold text-gray-800 mt-2 mb-1">Regional Levels</h3>
          <ul className="space-y-1 text-gray-600">
            <li>⚡ Energy Spark</li>
            <li>👥 Community Rise</li>
            <li>🏠 Tide Hut</li>
            <li>🏰 Ocean Citadel</li>
            <li>👑 Poseidon's Hub</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default MapPage;