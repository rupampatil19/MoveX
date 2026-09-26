import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Tooltip, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  PUNE_REGIONS, BENGALURU_REGIONS, MUMBAI_REGIONS, DELHI_REGIONS,
  HYDERABAD_REGIONS, CHENNAI_REGIONS, KOLKATA_REGIONS, AHMEDABAD_REGIONS,
  NASHIK_REGIONS, NAGPUR_REGIONS, KOLHAPUR_REGIONS, SOLAPUR_REGIONS,
  NANDED_REGIONS, AMRAVATI_REGIONS, SANGLI_REGIONS, JALGAON_REGIONS,
  AKOLA_REGIONS, LATUR_REGIONS,
  BHOPAL_REGIONS, INDORE_REGIONS, GWALIOR_REGIONS, JABALPUR_REGIONS,
  UJJAIN_REGIONS, SAGAR_REGIONS, SATNA_REGIONS, REWA_REGIONS,
  JAIPUR_REGIONS, JODHPUR_REGIONS, UDAIPUR_REGIONS, KOTA_REGIONS,
  AJMER_REGIONS, BIKANER_REGIONS, ALWAR_REGIONS, BHARATPUR_REGIONS,
  LUCKNOW_REGIONS, PATNA_REGIONS, RANCHI_REGIONS,
  BHUBANESWAR_REGIONS, RAIPUR_REGIONS,
  VISAKHAPATNAM_REGIONS, GURUGRAM_REGIONS,
  KOCHI_REGIONS, LUDHIANA_REGIONS,
  SRINAGAR_REGIONS, SHIMLA_REGIONS, DEHRADUN_REGIONS,
  GUWAHATI_REGIONS, GANGTOK_REGIONS,
  getRegionLevel, getHubImagePath, getHubName, getStateLevel,
} from '../data/regionConfig';
import { generateRegionPolygons, calculateCentroid } from '../utils/regionUtils';
import API from '../api';
import MapZoomWatcher from './map/MapZoomWatcher';
import MapCenterWatcher from './map/MapCenterWatcher';
import IndiaLayer from './map/IndiaLayer';
import MaharashtraLayer from './map/MaharashtraLayer';
import CityStationsLayer from './map/CityStationsLayer';
import CityCollectiveHub from './map/CityCollectiveHub';
import StateHubsLayer from './map/StateHubsLayer';
import StateBoundariesLayer from './map/StateBoundariesLayer';
import IndiaOutlineLayer from './map/IndiaOutlineLayer';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow,
});

const CITIES = {
  pune: { id: 'pune', name: 'Pune', state: 'Maharashtra', regions: PUNE_REGIONS, center: [18.56, 73.85], polygonCenter: { lat: 18.56, lng: 73.85 }, stationPosition: [18.5204, 73.8567], zoom: 12 },
  mumbai: { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', regions: MUMBAI_REGIONS, center: [19.0760, 72.8777], polygonCenter: { lat: 19.0760, lng: 72.8777 }, stationPosition: [19.0760, 72.8777], zoom: 11, polygonOptions: { oceanRanges: [{ fromDeg: 130, toDeg: 280 }], oceanRadiusFactor: 0.35 } },
  nashik: { id: 'nashik', name: 'Nashik', state: 'Maharashtra', regions: NASHIK_REGIONS, center: [19.9975, 73.7898], polygonCenter: { lat: 19.9975, lng: 73.7898 }, stationPosition: [19.9975, 73.7898], zoom: 12 },
  nagpur: { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra', regions: NAGPUR_REGIONS, center: [21.1458, 79.0882], polygonCenter: { lat: 21.1458, lng: 79.0882 }, stationPosition: [21.1458, 79.0882], zoom: 12 },
  kolhapur: { id: 'kolhapur', name: 'Kolhapur', state: 'Maharashtra', regions: KOLHAPUR_REGIONS, center: [16.7050, 74.2433], polygonCenter: { lat: 16.7050, lng: 74.2433 }, stationPosition: [16.7050, 74.2433], zoom: 12 },
  solapur: { id: 'solapur', name: 'Solapur', state: 'Maharashtra', regions: SOLAPUR_REGIONS, center: [17.6599, 75.9064], polygonCenter: { lat: 17.6599, lng: 75.9064 }, stationPosition: [17.6599, 75.9064], zoom: 12 },
  nanded: { id: 'nanded', name: 'Nanded', state: 'Maharashtra', regions: NANDED_REGIONS, center: [19.1383, 77.3210], polygonCenter: { lat: 19.1383, lng: 77.3210 }, stationPosition: [19.1383, 77.3210], zoom: 12 },
  amravati: { id: 'amravati', name: 'Amravati', state: 'Maharashtra', regions: AMRAVATI_REGIONS, center: [20.9374, 77.7796], polygonCenter: { lat: 20.9374, lng: 77.7796 }, stationPosition: [20.9374, 77.7796], zoom: 12 },
  sangli: { id: 'sangli', name: 'Sangli', state: 'Maharashtra', regions: SANGLI_REGIONS, center: [16.8524, 74.5815], polygonCenter: { lat: 16.8524, lng: 74.5815 }, stationPosition: [16.8524, 74.5815], zoom: 12 },
  jalgaon: { id: 'jalgaon', name: 'Jalgaon', state: 'Maharashtra', regions: JALGAON_REGIONS, center: [21.0077, 75.5626], polygonCenter: { lat: 21.0077, lng: 75.5626 }, stationPosition: [21.0077, 75.5626], zoom: 12 },
  akola: { id: 'akola', name: 'Akola', state: 'Maharashtra', regions: AKOLA_REGIONS, center: [20.7002, 77.0082], polygonCenter: { lat: 20.7002, lng: 77.0082 }, stationPosition: [20.7002, 77.0082], zoom: 12 },
  latur: { id: 'latur', name: 'Latur', state: 'Maharashtra', regions: LATUR_REGIONS, center: [18.4088, 76.5604], polygonCenter: { lat: 18.4088, lng: 76.5604 }, stationPosition: [18.4088, 76.5604], zoom: 12 },

  bhopal: { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', regions: BHOPAL_REGIONS, center: [23.2599, 77.4126], polygonCenter: { lat: 23.2599, lng: 77.4126 }, stationPosition: [23.2599, 77.4126], zoom: 12 },
  indore: { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', regions: INDORE_REGIONS, center: [22.7196, 75.8577], polygonCenter: { lat: 22.7260, lng: 75.8721 }, stationPosition: [22.7196, 75.8577], zoom: 12 },
  gwalior: { id: 'gwalior', name: 'Gwalior', state: 'Madhya Pradesh', regions: GWALIOR_REGIONS, center: [26.2183, 78.1828], polygonCenter: { lat: 26.2183, lng: 78.1828 }, stationPosition: [26.2183, 78.1828], zoom: 12 },
  jabalpur: { id: 'jabalpur', name: 'Jabalpur', state: 'Madhya Pradesh', regions: JABALPUR_REGIONS, center: [23.1815, 79.9864], polygonCenter: { lat: 23.1717, lng: 79.9450 }, stationPosition: [23.1815, 79.9864], zoom: 12 },
  ujjain: { id: 'ujjain', name: 'Ujjain', state: 'Madhya Pradesh', regions: UJJAIN_REGIONS, center: [23.1765, 75.7885], polygonCenter: { lat: 23.1765, lng: 75.7885 }, stationPosition: [23.1765, 75.7885], zoom: 12 },
  sagar: { id: 'sagar', name: 'Sagar', state: 'Madhya Pradesh', regions: SAGAR_REGIONS, center: [23.8388, 78.7378], polygonCenter: { lat: 23.8388, lng: 78.7378 }, stationPosition: [23.8388, 78.7378], zoom: 12 },
  satna: { id: 'satna', name: 'Satna', state: 'Madhya Pradesh', regions: SATNA_REGIONS, center: [24.5700, 80.8322], polygonCenter: { lat: 24.5700, lng: 80.8322 }, stationPosition: [24.5700, 80.8322], zoom: 12 },
  rewa: { id: 'rewa', name: 'Rewa', state: 'Madhya Pradesh', regions: REWA_REGIONS, center: [24.5362, 81.3037], polygonCenter: { lat: 24.5362, lng: 81.3037 }, stationPosition: [24.5362, 81.3037], zoom: 12 },

  jaipur: { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', regions: JAIPUR_REGIONS, center: [26.9124, 75.7873], polygonCenter: { lat: 26.9124, lng: 75.7873 }, stationPosition: [26.9124, 75.7873], zoom: 12 },
  jodhpur: { id: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', regions: JODHPUR_REGIONS, center: [26.2389, 73.0243], polygonCenter: { lat: 26.2389, lng: 73.0243 }, stationPosition: [26.2389, 73.0243], zoom: 12 },
  udaipur: { id: 'udaipur', name: 'Udaipur', state: 'Rajasthan', regions: UDAIPUR_REGIONS, center: [24.5854, 73.7125], polygonCenter: { lat: 24.5854, lng: 73.7125 }, stationPosition: [24.5854, 73.7125], zoom: 12 },
  kota: { id: 'kota', name: 'Kota', state: 'Rajasthan', regions: KOTA_REGIONS, center: [25.2138, 75.8648], polygonCenter: { lat: 25.2138, lng: 75.8648 }, stationPosition: [25.2138, 75.8648], zoom: 12 },
  ajmer: { id: 'ajmer', name: 'Ajmer', state: 'Rajasthan', regions: AJMER_REGIONS, center: [26.4499, 74.6399], polygonCenter: { lat: 26.4499, lng: 74.6399 }, stationPosition: [26.4499, 74.6399], zoom: 12 },
  bikaner: { id: 'bikaner', name: 'Bikaner', state: 'Rajasthan', regions: BIKANER_REGIONS, center: [28.0229, 73.3119], polygonCenter: { lat: 28.0229, lng: 73.3119 }, stationPosition: [28.0229, 73.3119], zoom: 12 },
  alwar: { id: 'alwar', name: 'Alwar', state: 'Rajasthan', regions: ALWAR_REGIONS, center: [27.5530, 76.6346], polygonCenter: { lat: 27.5530, lng: 76.6346 }, stationPosition: [27.5530, 76.6346], zoom: 12 },
  bharatpur: { id: 'bharatpur', name: 'Bharatpur', state: 'Rajasthan', regions: BHARATPUR_REGIONS, center: [27.2152, 77.5030], polygonCenter: { lat: 27.2152, lng: 77.5030 }, stationPosition: [27.2152, 77.5030], zoom: 12 },

  lucknow: { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', regions: LUCKNOW_REGIONS, center: [26.8467, 80.9462], polygonCenter: { lat: 26.8467, lng: 80.9462 }, stationPosition: [26.8467, 80.9462], zoom: 12 },
  patna: { id: 'patna', name: 'Patna', state: 'Bihar', regions: PATNA_REGIONS, center: [25.5941, 85.1376], polygonCenter: { lat: 25.5941, lng: 85.1376 }, stationPosition: [25.5941, 85.1376], zoom: 12 },
  ranchi: { id: 'ranchi', name: 'Ranchi', state: 'Jharkhand', regions: RANCHI_REGIONS, center: [23.3441, 85.3096], polygonCenter: { lat: 23.3441, lng: 85.3096 }, stationPosition: [23.3441, 85.3096], zoom: 12 },
  bhubaneswar: { id: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', regions: BHUBANESWAR_REGIONS, center: [20.2961, 85.8245], polygonCenter: { lat: 20.2961, lng: 85.8245 }, stationPosition: [20.2961, 85.8245], zoom: 12 },
  raipur: { id: 'raipur', name: 'Raipur', state: 'Chhattisgarh', regions: RAIPUR_REGIONS, center: [21.2514, 81.6296], polygonCenter: { lat: 21.2514, lng: 81.6296 }, stationPosition: [21.2514, 81.6296], zoom: 12 },
  visakhapatnam: { id: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', regions: VISAKHAPATNAM_REGIONS, center: [17.6868, 83.2185], polygonCenter: { lat: 17.6868, lng: 83.2185 }, stationPosition: [17.6868, 83.2185], zoom: 12 },
  gurugram: { id: 'gurugram', name: 'Gurugram', state: 'Haryana', regions: GURUGRAM_REGIONS, center: [28.4595, 77.0266], polygonCenter: { lat: 28.4595, lng: 77.0266 }, stationPosition: [28.4595, 77.0266], zoom: 12 },
  kochi: { id: 'kochi', name: 'Kochi', state: 'Kerala', regions: KOCHI_REGIONS, center: [9.9312, 76.2673], polygonCenter: { lat: 9.9312, lng: 76.2673 }, stationPosition: [9.9312, 76.2673], zoom: 12, polygonOptions: { oceanRanges: [{ fromDeg: 180, toDeg: 300 }], oceanRadiusFactor: 0.4 } },
  ludhiana: { id: 'ludhiana', name: 'Ludhiana', state: 'Punjab', regions: LUDHIANA_REGIONS, center: [30.9010, 75.8573], polygonCenter: { lat: 30.9010, lng: 75.8573 }, stationPosition: [30.9010, 75.8573], zoom: 12 },
  srinagar: { id: 'srinagar', name: 'Srinagar', state: 'Jammu & Kashmir', regions: SRINAGAR_REGIONS, center: [34.0837, 74.7973], polygonCenter: { lat: 34.0837, lng: 74.7973 }, stationPosition: [34.0837, 74.7973], zoom: 12 },
  shimla: { id: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', regions: SHIMLA_REGIONS, center: [31.1048, 77.1734], polygonCenter: { lat: 31.1048, lng: 77.1734 }, stationPosition: [31.1048, 77.1734], zoom: 12 },
  dehradun: { id: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', regions: DEHRADUN_REGIONS, center: [30.3165, 78.0322], polygonCenter: { lat: 30.3165, lng: 78.0322 }, stationPosition: [30.3165, 78.0322], zoom: 12 },
  guwahati: { id: 'guwahati', name: 'Guwahati', state: 'Assam', regions: GUWAHATI_REGIONS, center: [26.1445, 91.7362], polygonCenter: { lat: 26.1445, lng: 91.7362 }, stationPosition: [26.1445, 91.7362], zoom: 12 },
  gangtok: { id: 'gangtok', name: 'Gangtok', state: 'Sikkim', regions: GANGTOK_REGIONS, center: [27.3389, 88.6065], polygonCenter: { lat: 27.3389, lng: 88.6065 }, stationPosition: [27.3389, 88.6065], zoom: 12 },

  bengaluru: { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', regions: BENGALURU_REGIONS, center: [12.9716, 77.5946], polygonCenter: { lat: 12.9716, lng: 77.5946 }, stationPosition: [12.9716, 77.5946], zoom: 12 },
  delhi: { id: 'delhi', name: 'Delhi', state: 'Delhi', regions: DELHI_REGIONS, center: [28.6139, 77.2090], polygonCenter: { lat: 28.6139, lng: 77.2090 }, stationPosition: [28.6139, 77.2090], zoom: 11 },
  hyderabad: { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', regions: HYDERABAD_REGIONS, center: [17.3850, 78.4867], polygonCenter: { lat: 17.3850, lng: 78.4867 }, stationPosition: [17.3850, 78.4867], zoom: 11 },
  chennai: { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', regions: CHENNAI_REGIONS, center: [13.0827, 80.2707], polygonCenter: { lat: 13.0827, lng: 80.2707 }, stationPosition: [13.0827, 80.2707], zoom: 11, polygonOptions: { oceanRanges: [{ fromDeg: -60, toDeg: 60 }], oceanRadiusFactor: 0.35 } },
  kolkata: { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', regions: KOLKATA_REGIONS, center: [22.5726, 88.3639], polygonCenter: { lat: 22.5726, lng: 88.3639 }, stationPosition: [22.5726, 88.3639], zoom: 11 },
  ahmedabad: { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', regions: AHMEDABAD_REGIONS, center: [23.0225, 72.5714], polygonCenter: { lat: 23.0225, lng: 72.5714 }, stationPosition: [23.0225, 72.5714], zoom: 11 },
};

const STATES = {
  Maharashtra: { id: 'Maharashtra', name: 'Maharashtra', cityIds: ['pune','mumbai','nashik','nagpur','kolhapur','solapur','nanded','amravati','sangli','jalgaon','akola','latur'], stationPosition: [19.75, 75.7] },
  'Madhya Pradesh': { id: 'Madhya Pradesh', name: 'Madhya Pradesh', cityIds: ['bhopal','indore','gwalior','jabalpur','ujjain','sagar','satna','rewa'], stationPosition: [23.2599, 77.4126] },
  Rajasthan: { id: 'Rajasthan', name: 'Rajasthan', cityIds: ['jaipur','jodhpur','udaipur','kota','ajmer','bikaner','alwar','bharatpur'], stationPosition: [26.6, 73.9] },
  'Uttar Pradesh': { id: 'Uttar Pradesh', name: 'Uttar Pradesh', cityIds: ['lucknow'], stationPosition: [26.85, 80.5] },
  Bihar: { id: 'Bihar', name: 'Bihar', cityIds: ['patna'], stationPosition: [25.8, 85.5] },
  Jharkhand: { id: 'Jharkhand', name: 'Jharkhand', cityIds: ['ranchi'], stationPosition: [23.6, 85.5] },
  Odisha: { id: 'Odisha', name: 'Odisha', cityIds: ['bhubaneswar'], stationPosition: [20.3, 84.5] },
  Chhattisgarh: { id: 'Chhattisgarh', name: 'Chhattisgarh', cityIds: ['raipur'], stationPosition: [21.3, 81.9] },
  'Andhra Pradesh': { id: 'Andhra Pradesh', name: 'Andhra Pradesh', cityIds: ['visakhapatnam'], stationPosition: [15.9, 79.7] },
  Haryana: { id: 'Haryana', name: 'Haryana', cityIds: ['gurugram'], stationPosition: [29.0588, 76.0856] },
  Kerala: { id: 'Kerala', name: 'Kerala', cityIds: ['kochi'], stationPosition: [10.3, 76.3] },
  Punjab: { id: 'Punjab', name: 'Punjab', cityIds: ['ludhiana'], stationPosition: [31.1, 75.3] },
  'Jammu & Kashmir': { id: 'Jammu & Kashmir', name: 'Jammu & Kashmir', cityIds: ['srinagar'], stationPosition: [33.7782, 76.5762] },
  'Himachal Pradesh': { id: 'Himachal Pradesh', name: 'Himachal Pradesh', cityIds: ['shimla'], stationPosition: [31.8, 77.5] },
  Uttarakhand: { id: 'Uttarakhand', name: 'Uttarakhand', cityIds: ['dehradun'], stationPosition: [30.1, 79.1] },
  Assam: { id: 'Assam', name: 'Assam', cityIds: ['guwahati'], stationPosition: [26.2, 92.9] },
  Sikkim: { id: 'Sikkim', name: 'Sikkim', cityIds: ['gangtok'], stationPosition: [27.5, 88.5] },
  Karnataka: { id: 'Karnataka', name: 'Karnataka', cityIds: ['bengaluru'], stationPosition: [15.32, 75.71] },
  Delhi: { id: 'Delhi', name: 'Delhi', cityIds: ['delhi'], stationPosition: [28.61, 77.21] },
  Telangana: { id: 'Telangana', name: 'Telangana', cityIds: ['hyderabad'], stationPosition: [18.11, 79.02] },
  'Tamil Nadu': { id: 'Tamil Nadu', name: 'Tamil Nadu', cityIds: ['chennai'], stationPosition: [11.13, 78.66] },
  'West Bengal': { id: 'West Bengal', name: 'West Bengal', cityIds: ['kolkata'], stationPosition: [22.99, 87.86] },
  Gujarat: { id: 'Gujarat', name: 'Gujarat', cityIds: ['ahmedabad'], stationPosition: [22.26, 71.19] },
};

function findCityForRegion(regionId) {
  if (!regionId) return 'pune';
  for (const c of Object.values(CITIES)) {
    if (c.regions.some((r) => r.id === regionId)) return c.id;
  }
  return 'pune';
}

function createRegionHubIcon(imagePath, size = 40) {
  const anchor = size / 2;
  return L.divIcon({
    className: 'region-hub-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:2px solid #00CFFF;box-shadow:0 0 8px rgba(0,207,255,0.5);display:flex;align-items:center;justify-content:center;background:transparent;"><img src="${imagePath}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" /></div>`,
    iconSize: [size, size], iconAnchor: [anchor, anchor], tooltipAnchor: [0, -anchor],
  });
}

function MapController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target.center, target.zoom, { duration: 1.0 });
  }, [map, target]);
  return null;
}

const DashboardMap = ({ userRegion }) => {
  const [regionData, setRegionData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [zoom, setZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState([18.56, 73.85]);
  const [flyTarget, setFlyTarget] = useState(null);

  const homeCityId = useMemo(() => findCityForRegion(userRegion), [userRegion]);
  const homeCity = CITIES[homeCityId];

  const handleZoomChange = useCallback((z) => setZoom(z), []);
  const handleCenterChange = useCallback((c) => setMapCenter(c), []);

  const activeCityId = useMemo(() => {
    let best = homeCityId;
    let bestD2 = Infinity;
    for (const c of Object.values(CITIES)) {
      const dlat = c.center[0] - mapCenter[0];
      const dlng = (c.center[1] - mapCenter[1]) * Math.cos((mapCenter[0] * Math.PI) / 180);
      const d2 = dlat * dlat + dlng * dlng;
      if (d2 < bestD2) { bestD2 = d2; best = c.id; }
    }
    return best;
  }, [mapCenter, homeCityId]);

  const city = CITIES[activeCityId];
  const stateId = city.state;

  const regionPolygons = useMemo(
    () => generateRegionPolygons(city.regions, city.polygonCenter, city.polygonOptions),
    [city]
  );

  const centroidCache = useMemo(() => {
    const cache = {};
    Object.entries(regionPolygons).forEach(([id, coords]) => { cache[id] = calculateCentroid(coords); });
    return cache;
  }, [regionPolygons]);

  const showIndia = zoom <= 6;
  const showState = zoom >= 7 && zoom <= 8;
  const showCityHub = zoom >= 9 && zoom <= 10;
  const showRegions = zoom >= 11;

  useEffect(() => { fetchRegions(); }, []);

  const fetchRegions = async () => {
    try {
      const res = await API.get('/community/all');
      setRegionData(res.data);
    } catch (err) { console.error('DashboardMap fetch error:', err); }
  };

  const getRegionEnergy = (regionId) => {
    const data = regionData.find((r) => r.region === regionId);
    return data?.totalEnergy || 0;
  };

  const cityTotalEnergy = useMemo(() => city.regions.reduce((sum, r) => sum + getRegionEnergy(r.id), 0), [city, regionData]);

  const cityEnergies = useMemo(() => {
    const out = {};
    Object.values(CITIES).forEach((c) => { out[c.id] = c.regions.reduce((s, r) => s + getRegionEnergy(r.id), 0); });
    return out;
  }, [regionData]);

  const stateEnergies = useMemo(() => {
    const out = {};
    Object.values(STATES).forEach((st) => { out[st.id] = st.cityIds.reduce((sum, cid) => sum + (cityEnergies[cid] || 0), 0); });
    return out;
  }, [cityEnergies]);

  const stateEnergiesByName = useMemo(() => {
    const out = {};
    Object.values(STATES).forEach((st) => { out[st.name] = stateEnergies[st.id] || 0; });
    return out;
  }, [stateEnergies]);

  const citiesInActiveState = useMemo(() => {
    const out = {};
    Object.values(CITIES).forEach((c) => { if (c.state === stateId) out[c.id] = c; });
    return out;
  }, [stateId]);

  const indiaTotalEnergy = useMemo(() => Object.values(stateEnergies).reduce((a, b) => a + b, 0), [stateEnergies]);

  const header = useMemo(() => {
    if (showIndia) return { title: 'India Living Map', subtitle: 'Live • Real-time • Game Board', scope: 'india' };
    if (showState) {
      const st = STATES[stateId];
      const activeCities = st ? st.cityIds.length : 0;
      return { title: `${stateId} Living Map`, subtitle: `${activeCities} Active ${activeCities === 1 ? 'City' : 'Cities'} • Live`, scope: `state:${stateId}` };
    }
    if (showCityHub) return { title: `${city.name} Living Map`, subtitle: 'City Energy • Live', scope: `city:${city.id}` };
    return { title: `${city.name} Living Map`, subtitle: `${city.regions.length} Connected Regions • Live`, scope: `city:${city.id}` };
  }, [showIndia, showState, showCityHub, showRegions, city, stateId]);

  const fullMapUrl = useMemo(() => `/map?scope=${encodeURIComponent(header.scope)}`, [header.scope]);

  const handleRegionClick = (region) => {
    const energy = getRegionEnergy(region.id);
    const level = getRegionLevel(energy);
    const hubName = getHubName(level);
    const hubImage = getHubImagePath(level);
    setSelectedCity(null);
    setSelectedRegion({ ...region, energy, level, hubName, hubImage });
  };

  const handleStateClick = (sid) => {
    const st = STATES[sid]; if (!st) return;
    setFlyTarget({ center: st.stationPosition, zoom: 7 });
  };

  const handleCityClick = (cityId) => {
    const c = CITIES[cityId]; if (!c) return;
    setFlyTarget({ center: c.center, zoom: c.zoom });
  };

  const handleStateHubClick = (sid) => {
    const st = STATES[sid]; if (!st) return;
    const energy = stateEnergies[sid] || 0;
    const level = getStateLevel(energy);
    setSelectedRegion(null); setSelectedCity(null);
    setSelectedRegion({ id: st.name, energy, level, hubName: getHubName(level), hubImage: getHubImagePath(level), _isState: true });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden w-full lg:max-w-[300px] lg:mx-auto">
      <div className="p-3 border-b border-gray-100 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-800 truncate">{header.title}</h2>
          <p className="text-[11px] text-gray-500 truncate">{header.subtitle}</p>
        </div>
        <Link to={fullMapUrl} className="text-[#2563EB] text-xs font-medium whitespace-nowrap shrink-0">View Full Map →</Link>
      </div>

      <div className="relative w-full aspect-[21/20] sm:aspect-square">
        <MapContainer center={homeCity.center} zoom={12} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapZoomWatcher onZoomChange={handleZoomChange} />
          <MapCenterWatcher onChange={handleCenterChange} />
          <MapController target={flyTarget} />
          <StateBoundariesLayer />
          <IndiaOutlineLayer />

          {showIndia && (
            <IndiaLayer
              stateEnergies={stateEnergiesByName}
              userState={stateId}
              onStateClick={(stateName) => {
                const key = stateName.toLowerCase();
                const found = Object.values(STATES).find((s) => s.name.toLowerCase() === key);
                if (found) handleStateClick(found.id);
              }}
            />
          )}
          {showState && <MaharashtraLayer onCityClick={(cityName) => { const found = Object.values(CITIES).find((c) => c.name === cityName); if (found) handleCityClick(found.id); }} />}
          {showState && <CityStationsLayer cities={citiesInActiveState} cityEnergies={cityEnergies} onCityClick={handleCityClick} size={36} showLabels={true} />}
          {showIndia && <StateHubsLayer states={STATES} stateEnergies={stateEnergies} size={32} onStateClick={handleStateHubClick} />}
          {showState && STATES[stateId] && (
            <StateHubsLayer states={{ [stateId]: STATES[stateId] }} stateEnergies={stateEnergies} size={64} onStateClick={handleStateHubClick} />
          )}
          {showCityHub && (
            <CityCollectiveHub city={city} totalEnergy={cityTotalEnergy} size={56} onClick={(data) => { setSelectedRegion(null); setSelectedCity(data); }} />
          )}
          {showRegions && city.regions.map((region) => {
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
                <Polygon positions={polygonCoords} pathOptions={{ color: isUserRegion ? '#2563EB' : region.color, fillColor: region.color, fillOpacity: isUserRegion ? 0.35 : 0.15, weight: isUserRegion ? 3 : 2 }} eventHandlers={{ click: () => handleRegionClick(region) }} />
                <Marker position={hubPosition} icon={createRegionHubIcon(hubImage, 40)} eventHandlers={{ click: () => handleRegionClick(region) }}>
                  <Tooltip direction="top" offset={[0, -20]} opacity={1}><span className="font-semibold">{region.id}</span><br /><span>Level {level} — {hubName}</span></Tooltip>
                </Marker>
              </div>
            );
          })}
        </MapContainer>

        {selectedCity ? (
          <div className="absolute bottom-2 left-2 right-2 bg-white/95 rounded-lg p-2 shadow text-xs z-[500] flex items-center gap-2">
            <img src={selectedCity.imagePath} alt={`${selectedCity.city.name} Hub`} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            <div className="min-w-0 flex-1"><p className="font-semibold truncate">{selectedCity.city.name} Hub</p><p className="text-[#2563EB] truncate">{selectedCity.hubName} • L{selectedCity.level}</p></div>
            <button onClick={() => setFlyTarget({ center: city.center, zoom: 12 })} className="text-[#2563EB] text-[10px] font-semibold px-2 py-1 rounded bg-blue-50 shrink-0">Explore</button>
          </div>
        ) : selectedRegion ? (
          <div className="absolute bottom-2 left-2 right-2 bg-white/95 rounded-lg p-2 shadow text-xs z-[500] flex items-center gap-2">
            <img src={selectedRegion.hubImage} alt={selectedRegion.hubName} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            <div className="min-w-0 flex-1"><p className="font-semibold truncate">{selectedRegion.id}</p><p className="text-[#2563EB] truncate">{selectedRegion.hubName} • L{selectedRegion.level}</p></div>
            <Link to={`/leaderboard?scope=region&regionId=${encodeURIComponent(selectedRegion.id)}&cityId=${encodeURIComponent(city.id)}&stateId=${encodeURIComponent(stateId)}`} className="text-[#2563EB] text-[10px] font-semibold px-2 py-1 rounded bg-blue-50 shrink-0">Rank</Link>
          </div>
        ) : (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-[10px] text-gray-600 px-2 py-1 rounded shadow z-[500]">
            {showRegions ? 'Click a region' : showCityHub ? `Click the ${city.name} Hub` : showState ? 'Click a city Hub' : 'Tap a state'}
          </div>
        )}

        {showIndia && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[10px] text-gray-700 px-2 py-1 rounded shadow z-[500]">
            🇮🇳 {indiaTotalEnergy.toLocaleString()} energy
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMap;