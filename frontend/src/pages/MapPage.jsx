import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { PUNE_REGIONS, getRegionLevel, getHubImagePath, getHubName } from '../data/regionConfig';
import { generateRegionPolygons, calculateCentroid } from '../utils/regionUtils';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icon (not used for hubs)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Circular Hub image only (no text) for map markers
function createHubIcon(imagePath) {
  return L.divIcon({
    className: 'hub-marker',
    html: `
      <div style="
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid #00CFFF;
        box-shadow: 0 0 10px rgba(0,207,255,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
      ">
        <img src="${imagePath}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
    tooltipAnchor: [0, -30],
  });
}

const MapPage = () => {
  const [regionData, setRegionData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  const regionPolygons = useMemo(() => generateRegionPolygons(PUNE_REGIONS), []);
  const centroidCache = useMemo(() => {
    const cache = {};
    Object.entries(regionPolygons).forEach(([id, coords]) => {
      cache[id] = calculateCentroid(coords);
    });
    return cache;
  }, [regionPolygons]);

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
            const hubImage = getHubImagePath(level);
            const hubName = getHubName(level);
            const isSelected = selectedRegion?.id === region.id;
            const hubPosition = centroidCache[region.id];

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
                    click: () => setSelectedRegion({ ...region, energy, level, hubName, hubImage }),
                  }}
                />
                <Marker
                  position={hubPosition}
                  icon={createHubIcon(hubImage)}
                  eventHandlers={{
                    click: () => setSelectedRegion({ ...region, energy, level, hubName, hubImage }),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -30]} opacity={1}>
                    <span className="font-semibold">{region.id}</span><br />
                    <span>Level {level} — {hubName}</span>
                  </Tooltip>
                </Marker>
              </div>
            );
          })}
        </MapContainer>

        {/* Region Details Panel - bottom, responsive width, no overlap with legend */}
        <div className="absolute bottom-4 left-3 right-3 mx-auto md:left-4 md:right-auto md:mx-0 bg-[#0B1F2A]/95 backdrop-blur text-white rounded-2xl p-4 shadow-xl w-auto md:w-80 max-h-[60vh] overflow-y-auto z-[1000]">
          {selectedRegion ? (
            <>
              <div className="flex items-center gap-3">
                <img
                  src={selectedRegion.hubImage}
                  alt={selectedRegion.hubName}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #00CFFF',
                    boxShadow: '0 0 8px rgba(0,207,255,0.4)',
                  }}
                />
                <h2 className="text-xl font-bold text-white">{selectedRegion.id}</h2>
              </div>
              <p className="text-sm text-[#7DD3FC] mt-2">
                {selectedRegion.hubName} • Level {selectedRegion.level}
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
              </div>
              <div className="mt-4 flex gap-2">
                <Link to="/leaderboard" className="flex-1 bg-[#188AD8] text-white text-center py-2 rounded-lg">Leaderboard</Link>
                <Link to="/quests" className="flex-1 bg-[#20C9A6] text-white text-center py-2 rounded-lg">Challenges</Link>
              </div>
            </>
          ) : (
            <p className="text-gray-300">Select a region to see details.</p>
          )}
        </div>

        {/* Legend - top-right on mobile, bottom-right on md+ */}
        <div className="absolute top-3 right-3 md:top-auto md:bottom-4 md:right-4 bg-white/90 rounded-xl p-2 sm:p-3 shadow-lg text-xs sm:text-sm z-[1000] max-w-[180px] sm:max-w-xs">
          <h3 className="font-semibold text-gray-800 mb-1">Regions</h3>
          {PUNE_REGIONS.map(r => (
            <div key={r.id} className="flex items-center gap-1 sm:gap-2">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: r.color }}></span>
              <span className="text-gray-700">{r.id}</span>
            </div>
          ))}
          <h3 className="font-semibold text-gray-800 mt-2 mb-1">Hub Levels</h3>
          <div className="space-y-1 sm:space-y-2">
            {[1, 2, 3, 4, 5].map(level => (
              <div key={level} className="flex items-center gap-1 sm:gap-2">
                <img
                  src={getHubImagePath(level)}
                  alt={getHubName(level)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid #00CFFF',
                  }}
                />
                <span className="text-gray-700">{getHubName(level)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MapPage;