import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Tooltip, useMap } from 'react-leaflet';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { ChevronRight } from 'lucide-react';
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
import { getCityForRegion } from '../data/geoHierarchy';
import MapZoomWatcher from '../components/map/MapZoomWatcher';
import MapCenterWatcher from '../components/map/MapCenterWatcher';
import IndiaLayer from '../components/map/IndiaLayer';
import MaharashtraLayer from '../components/map/MaharashtraLayer';
import CityStationsLayer from '../components/map/CityStationsLayer';
import CityCollectiveHub from '../components/map/CityCollectiveHub';
import StateHubsLayer from '../components/map/StateHubsLayer';
import StateBoundariesLayer from '../components/map/StateBoundariesLayer';
import IndiaOutlineLayer from '../components/map/IndiaOutlineLayer';
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

function createHubIcon(imagePath) {
  return L.divIcon({
    className: 'hub-marker',
    html: `<div style="width:60px;height:60px;border-radius:50%;overflow:hidden;border:2px solid rgba(37,99,235,0.6);box-shadow:0 4px 12px rgba(15,23,42,0.15),0 0 16px rgba(37,99,235,0.25);display:flex;align-items:center;justify-content:center;background:transparent;"><img src="${imagePath}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" /></div>`,
    iconSize: [60, 60], iconAnchor: [30, 30], tooltipAnchor: [0, -30],
  });
}

function MapController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target.center, target.zoom, { duration: 1.2 });
  }, [map, target]);
  return null;
}

function findNearestCity(point) {
  let best = null, bestD2 = Infinity;
  for (const c of Object.values(CITIES)) {
    const dlat = c.center[0] - point[0];
    const dlng = (c.center[1] - point[1]) * Math.cos((point[0] * Math.PI) / 180);
    const d2 = dlat * dlat + dlng * dlng;
    if (d2 < bestD2) { bestD2 = d2; best = c.id; }
  }
  return best;
}

const MapPage = () => {
  // Determine the initial focus city.
  // Priority: 1) URL ?scope=, 2) user's registered region, 3) default India view.
  const initialCity = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const scope = params.get('scope');
    if (scope?.startsWith('city:')) {
      const cid = scope.slice(5);
      if (CITIES[cid]) return CITIES[cid];
    }
    if (scope === 'india' || scope?.startsWith('state:')) return null;

    try {
      const stored = localStorage.getItem('movex_user');
      if (!stored) return null;
      const user = JSON.parse(stored);
      if (!user?.region) return null;
      const geoCity = getCityForRegion(user.region);
      if (!geoCity) return null;
      return CITIES[geoCity.id] || null;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [regionData, setRegionData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(initialCity?.zoom ?? 5);
  const [mapCenter, setMapCenter] = useState(initialCity?.center ?? [22.0, 79.0]);
  const [flyTarget, setFlyTarget] = useState(null);
  const [navStateId, setNavStateId] = useState(initialCity?.state ?? null);
  const [navCityId, setNavCityId] = useState(initialCity?.id ?? null);
  const [searchParams] = useSearchParams();

  const handleZoomChange = useCallback((z) => setZoom(z), []);
  const handleCenterChange = useCallback((c) => setMapCenter(c), []);

  const activeCityId = useMemo(() => findNearestCity(mapCenter), [mapCenter]);
  const city = CITIES[activeCityId] || CITIES.pune;
  const activeStateId = navStateId || city.state;

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
  const showStateHub = zoom >= 7 && zoom <= 8;
  const showCityHub = zoom >= 9 && zoom <= 10;
  const showRegions = zoom >= 11;

  const navLevel = selectedRegion ? 'region' : navCityId ? 'city' : navStateId ? 'state' : 'india';

  const mapTitle = useMemo(() => {
    if (selectedRegion) return `${selectedRegion.id} Living Map`;
    if (navCityId && CITIES[navCityId]) return `${CITIES[navCityId].name} Living Map`;
    if (navStateId) return `${navStateId} Living Map`;
    return 'India Living Map';
  }, [selectedRegion, navCityId, navStateId]);

  useEffect(() => {
    if (!activeCityId) return;
    if (activeCityId === navCityId) return;
    const c = CITIES[activeCityId];
    if (!c) return;
    setNavStateId(c.state);
    setNavCityId(activeCityId);
    setSelectedRegion(null);
    setSelectedCity(null);
    setSelectedState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCityId]);

  const siblingCities = useMemo(() => (!navStateId ? [] : Object.values(CITIES).filter((c) => c.state === navStateId)), [navStateId]);
  const siblingRegions = useMemo(() => (!navCityId ? [] : CITIES[navCityId]?.regions || []), [navCityId]);

  useEffect(() => {
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(() => {}, () => {});
  }, []);

  useEffect(() => { fetchRegions(); }, []);

  useEffect(() => {
    const scope = searchParams.get('scope');
    if (!scope) return;
    if (scope === 'india') { navToIndia(); return; }
    if (scope.startsWith('state:')) { const sid = scope.slice(6); if (STATES[sid]) navToState(sid); return; }
    if (scope.startsWith('city:')) { const cid = scope.slice(5); if (CITIES[cid]) navToCity(cid); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchRegions = async () => {
    try {
      const res = await API.get('/community/all');
      setRegionData(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
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
    Object.values(CITIES).forEach((c) => { if (c.state === activeStateId) out[c.id] = c; });
    return out;
  }, [activeStateId]);

  const indiaTotalEnergy = useMemo(() => Object.values(stateEnergies).reduce((a, b) => a + b, 0), [stateEnergies]);

  const navToIndia = () => {
    setNavStateId(null); setNavCityId(null);
    setSelectedRegion(null); setSelectedCity(null); setSelectedState(null);
    setFlyTarget({ center: [22.0, 79.0], zoom: 5 });
  };
  const navToState = (stateId) => {
    const st = STATES[stateId]; if (!st) return;
    setNavStateId(stateId); setNavCityId(null);
    setSelectedRegion(null); setSelectedCity(null); setSelectedState(null);
    setFlyTarget({ center: st.stationPosition, zoom: 7 });
  };
  const navToCity = (cityId) => {
    const c = CITIES[cityId]; if (!c) return;
    setNavStateId(c.state); setNavCityId(cityId);
    setSelectedRegion(null); setSelectedCity(null); setSelectedState(null);
    setFlyTarget({ center: c.center, zoom: c.zoom });
  };
  const navToRegion = (regionId) => {
    const c = CITIES[navCityId]; if (!c) return;
    const region = c.regions.find((r) => r.id === regionId); if (!region) return;
    const energy = getRegionEnergy(regionId);
    const level = getRegionLevel(energy);
    const hubName = getHubName(level);
    const hubImage = getHubImagePath(level);
    setSelectedCity(null); setSelectedState(null);
    setSelectedRegion({ ...region, energy, level, hubName, hubImage });
    const polygon = regionPolygons[regionId];
    if (polygon && polygon.length > 0) { const centroid = calculateCentroid(polygon); setFlyTarget({ center: centroid, zoom: 13 }); }
    else { setFlyTarget({ center: c.center, zoom: 13 }); }
  };
  const handleRegionClick = (region, energy, level, hubName, hubImage) => {
    setNavStateId(city.state); setNavCityId(city.id);
    setSelectedCity(null); setSelectedState(null);
    setSelectedRegion({ ...region, energy, level, hubName, hubImage });
  };

  if (loading) return <div className="p-6 text-gray-700">Loading map...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">{mapTitle}</h1>

      <div className="space-y-2">
        <div className="flex items-center gap-1 text-sm overflow-x-auto pb-1 -mx-1 px-1">
          <button onClick={navToIndia} className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition shrink-0 shadow-sm ${navLevel === 'india' ? 'bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#2563EB]/25' : 'bg-white border border-surface-200 hover:border-surface-300 text-ink-700'}`}>🇮🇳 India</button>
          {navStateId && (<><ChevronRight className="w-4 h-4 text-gray-400 shrink-0" /><button onClick={() => navToState(navStateId)} className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition shrink-0 shadow-sm ${navLevel === 'state' ? 'bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#2563EB]/25' : 'bg-white border border-surface-200 hover:border-surface-300 text-ink-700'}`}>{navStateId}</button></>)}
          {navCityId && CITIES[navCityId] && (<><ChevronRight className="w-4 h-4 text-gray-400 shrink-0" /><button onClick={() => navToCity(navCityId)} className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition shrink-0 shadow-sm ${navLevel === 'city' ? 'bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#2563EB]/25' : 'bg-white border border-surface-200 hover:border-surface-300 text-ink-700'}`}>{CITIES[navCityId].name}</button></>)}
          {selectedRegion && (<><ChevronRight className="w-4 h-4 text-gray-400 shrink-0" /><button className="px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#2563EB]/25 shrink-0">{selectedRegion.id}</button></>)}
        </div>

        {navLevel === 'india' && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {Object.values(STATES).map((st) => (
              <button key={st.id} onClick={() => navToState(st.id)} className="px-3.5 py-1.5 rounded-full whitespace-nowrap text-sm font-medium bg-white border border-surface-200 hover:border-[#2563EB]/60 hover:shadow-sm text-ink-700 transition shrink-0">{st.name}</button>
            ))}
          </div>
        )}
        {navLevel === 'state' && siblingCities.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {siblingCities.map((c) => (
              <button key={c.id} onClick={() => navToCity(c.id)} className="px-3.5 py-1.5 rounded-full whitespace-nowrap text-sm font-medium bg-white border border-surface-200 hover:border-[#2563EB]/60 hover:shadow-sm text-ink-700 transition shrink-0">{c.name}</button>
            ))}
          </div>
        )}
        {navLevel === 'city' && siblingRegions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {siblingRegions.map((r) => (
              <button key={r.id} onClick={() => navToRegion(r.id)} className="px-3.5 py-1.5 rounded-full whitespace-nowrap text-sm font-medium bg-white border border-surface-200 hover:border-[#2563EB]/60 hover:shadow-sm text-ink-700 transition shrink-0">{r.id}</button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[75vh] rounded-hero overflow-hidden border border-surface-200/80 shadow-card relative">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          <MapZoomWatcher onZoomChange={handleZoomChange} />
          <MapCenterWatcher onChange={handleCenterChange} />
          <MapController target={flyTarget} />
          <StateBoundariesLayer />
          <IndiaOutlineLayer />

          {showIndia && (
            <IndiaLayer
              stateEnergies={stateEnergiesByName}
              userState={activeStateId}
              onStateClick={(stateName) => {
                const key = stateName.toLowerCase();
                const found = Object.values(STATES).find((s) => s.name.toLowerCase() === key);
                if (found) navToState(found.id);
              }}
            />
          )}
          {showStateHub && <MaharashtraLayer onCityClick={(cityName) => { const found = Object.values(CITIES).find((c) => c.name === cityName); if (found) navToCity(found.id); }} />}
          {showStateHub && <CityStationsLayer cities={citiesInActiveState} cityEnergies={cityEnergies} onCityClick={(cityId) => navToCity(cityId)} size={36} showLabels={true} />}
          {showIndia && <StateHubsLayer states={STATES} stateEnergies={stateEnergies} size={32} onStateClick={(stateId) => navToState(stateId)} />}
          {showStateHub && STATES[activeStateId] && (
            <StateHubsLayer
              states={{ [activeStateId]: STATES[activeStateId] }}
              stateEnergies={stateEnergies}
              size={110}
              onStateClick={(stateId) => {
                const st = STATES[stateId];
                setSelectedRegion(null); setSelectedCity(null);
                setSelectedState({ id: st.id, name: st.name, energy: stateEnergies[st.id] || 0, cityIds: st.cityIds });
              }}
            />
          )}
          {showCityHub && (
            <CityCollectiveHub city={city} totalEnergy={cityTotalEnergy} onClick={(data) => { setSelectedRegion(null); setSelectedState(null); setSelectedCity(data); }} />
          )}
          {showRegions && city.regions.map((region) => {
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
                <Polygon positions={polygonCoords} pathOptions={{ color: region.color, fillColor: region.color, fillOpacity: isSelected ? 0.4 : 0.2, weight: isSelected ? 3 : 2 }} eventHandlers={{ click: () => handleRegionClick(region, energy, level, hubName, hubImage) }} />
                <Marker position={hubPosition} icon={createHubIcon(hubImage)} eventHandlers={{ click: () => handleRegionClick(region, energy, level, hubName, hubImage) }}>
                  <Tooltip direction="top" offset={[0, -30]} opacity={1}><span className="font-semibold">{region.id}</span><br /><span>Level {level} — {hubName}</span></Tooltip>
                </Marker>
              </div>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-4 left-3 right-3 mx-auto md:left-4 md:right-auto md:mx-0 glass-strong text-ink-900 rounded-panel p-4 shadow-glass w-auto md:w-80 max-h-[60vh] overflow-y-auto z-[1000]">
          {selectedState ? (() => {
            const level = getStateLevel(selectedState.energy);
            const hubImage = getHubImagePath(level);
            const hubName = getHubName(level);
            const cityBreakdown = selectedState.cityIds.map((cid) => { const c = CITIES[cid]; if (!c) return null; return { cityId: cid, name: c.name, energy: cityEnergies[cid] || 0 }; }).filter(Boolean).sort((a, b) => b.energy - a.energy);
            return (
              <>
                <div className="flex items-center gap-3"><img src={hubImage} alt={`${selectedState.name} Hub`} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,99,235,0.55)', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }} /><div><h2 className="text-lg font-bold text-ink-900">{selectedState.name} Energy Hub</h2><p className="text-xs text-[#2563EB] font-medium">Level {level} • {hubName}</p></div></div>
                <div className="mt-3 space-y-2 text-sm"><div className="flex justify-between text-ink-700"><span>State Energy</span><span className="font-medium text-ink-900">{selectedState.energy.toLocaleString()}</span></div><div className="w-full bg-surface-100 rounded-full h-2"><div className="bg-[#20C9A6] h-2 rounded-full" style={{ width: `${Math.min((selectedState.energy / 1000000) * 100, 100)}%` }} /></div></div>
                <div className="mt-3"><p className="text-xs text-ink-500 mb-1">Cities contributing</p>{cityBreakdown.length === 0 ? <p className="text-xs text-ink-400">No cities yet</p> : cityBreakdown.slice(0, 8).map((cb) => (<div key={cb.cityId} className="flex justify-between text-xs py-1"><span className="text-ink-700">{cb.name}</span><span className="text-ink-900 font-medium">{cb.energy.toLocaleString()}</span></div>))}</div>
                <button onClick={() => { const firstCity = selectedState.cityIds[0]; if (firstCity) { setSelectedState(null); navToCity(firstCity); } }} className="mt-4 w-full bg-[#2563EB] text-white py-2 rounded-lg font-medium">View Cities</button>
                <Link to={`/leaderboard?scope=state&stateId=${encodeURIComponent(selectedState.id)}`} className="mt-2 w-full bg-[#188AD8] text-white text-center py-2 rounded-lg font-medium block">{selectedState.name} Leaderboard</Link>
              </>
            );
          })() : selectedCity ? (
            <>
              <div className="flex items-center gap-3"><img src={selectedCity.imagePath} alt={`${selectedCity.city.name} Hub`} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,99,235,0.55)', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }} /><div><h2 className="text-lg font-bold text-ink-900">{selectedCity.city.name} Hub</h2><p className="text-xs text-[#2563EB] font-medium">Level {selectedCity.level} • {selectedCity.hubName}</p></div></div>
              <div className="mt-3 space-y-2 text-sm"><div className="flex justify-between text-ink-700"><span>Collective Energy</span><span className="font-medium text-ink-900">{selectedCity.totalEnergy.toLocaleString()}</span></div><div className="w-full bg-surface-100 rounded-full h-2"><div className="bg-[#20C9A6] h-2 rounded-full" style={{ width: `${Math.min((selectedCity.totalEnergy / 500000) * 100, 100)}%` }} /></div><div className="flex justify-between text-xs text-gray-400 mt-1"><span>Active Regions</span><span className="text-white">{city.regions.length}</span></div></div>
              <button onClick={() => setFlyTarget({ center: city.center, zoom: 12 })} className="mt-4 w-full bg-[#2563EB] text-white py-2 rounded-lg font-medium">Explore {city.name} Regions</button>
              <Link to={`/leaderboard?scope=city&cityId=${encodeURIComponent(city.id)}&stateId=${encodeURIComponent(activeStateId)}`} className="mt-2 w-full bg-[#188AD8] text-white text-center py-2 rounded-lg font-medium block">{city.name} Leaderboard</Link>
            </>
          ) : selectedRegion ? (
            <>
              <div className="flex items-center gap-3"><img src={selectedRegion.hubImage} alt={selectedRegion.hubName} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,99,235,0.55)', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }} /><h2 className="text-xl font-bold text-ink-900">{selectedRegion.id}</h2></div>
              <p className="text-sm text-[#2563EB] font-medium mt-2">{selectedRegion.hubName} • Level {selectedRegion.level}</p>
              <div className="mt-3 space-y-2 text-sm"><div className="flex justify-between text-ink-700"><span>Regional Energy</span><span className="font-medium text-ink-900">{selectedRegion.energy.toLocaleString()} / {selectedRegion.level >= 5 ? 'Max' : 20000 * selectedRegion.level}</span></div><div className="w-full bg-surface-100 rounded-full h-2"><div className="bg-[#20C9A6] h-2 rounded-full" style={{ width: `${selectedRegion.level >= 5 ? 100 : Math.min((selectedRegion.energy / (20000 * selectedRegion.level)) * 100, 100)}%` }} /></div></div>
              <div className="mt-4 flex gap-2"><Link to={`/leaderboard?scope=region&regionId=${encodeURIComponent(selectedRegion.id)}&cityId=${encodeURIComponent(city.id)}&stateId=${encodeURIComponent(activeStateId)}`} className="flex-1 bg-[#188AD8] text-white text-center py-2 rounded-lg">Leaderboard</Link><Link to="/quests" className="flex-1 bg-[#20C9A6] text-white text-center py-2 rounded-lg">Challenges</Link></div>
            </>
          ) : (
            <p className="text-ink-700">{navLevel === 'india' ? `🇮🇳 India Total: ${indiaTotalEnergy.toLocaleString()} energy` : navLevel === 'state' ? `Click a city Hub in ${navStateId} to explore.` : navLevel === 'city' ? `Pick a region of ${CITIES[navCityId]?.name} above.` : 'Explore the map.'}</p>
          )}
        </div>

        {showRegions && (
          <div className="absolute top-3 right-3 md:top-auto md:bottom-4 md:right-4 bg-white rounded-panel p-2.5 sm:p-3 shadow-card border border-surface-200/70 text-xs sm:text-sm z-[1000] max-w-[180px] sm:max-w-xs">
            <h3 className="font-semibold text-gray-800 mb-1">{city.name} Regions</h3>
            {city.regions.map((r) => (<div key={r.id} className="flex items-center gap-1 sm:gap-2"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: r.color }}></span><span className="text-gray-700">{r.id}</span></div>))}
            <h3 className="font-semibold text-gray-800 mt-2 mb-1">Hub Levels</h3>
            <div className="space-y-1 sm:space-y-2">{[1, 2, 3, 4, 5].map((level) => (<div key={level} className="flex items-center gap-1 sm:gap-2"><img src={getHubImagePath(level)} alt={getHubName(level)} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1px solid #00CFFF' }} /><span className="text-gray-700">{getHubName(level)}</span></div>))}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MapPage;