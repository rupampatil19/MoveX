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
} from './regionConfig';

export const STATES = [
  { id: 'MH', name: 'Maharashtra' },
  { id: 'MP', name: 'Madhya Pradesh' },
  { id: 'RJ', name: 'Rajasthan' },
  { id: 'UP', name: 'Uttar Pradesh' },
  { id: 'BR', name: 'Bihar' },
  { id: 'JH', name: 'Jharkhand' },
  { id: 'OD', name: 'Odisha' },
  { id: 'CG', name: 'Chhattisgarh' },
  { id: 'AP', name: 'Andhra Pradesh' },
  { id: 'HR', name: 'Haryana' },
  { id: 'KL', name: 'Kerala' },
  { id: 'PB', name: 'Punjab' },
  { id: 'JK', name: 'Jammu & Kashmir' },
  { id: 'HP', name: 'Himachal Pradesh' },
  { id: 'UK', name: 'Uttarakhand' },
  { id: 'AS', name: 'Assam' },
  { id: 'SK', name: 'Sikkim' },
  { id: 'KA', name: 'Karnataka' },
  { id: 'DL', name: 'Delhi' },
  { id: 'TG', name: 'Telangana' },
  { id: 'TN', name: 'Tamil Nadu' },
  { id: 'WB', name: 'West Bengal' },
  { id: 'GJ', name: 'Gujarat' },
];

export const CITIES = [
  { id: 'pune', name: 'Pune', stateId: 'MH', regionIds: PUNE_REGIONS.map((r) => r.id) },
  { id: 'mumbai', name: 'Mumbai', stateId: 'MH', regionIds: MUMBAI_REGIONS.map((r) => r.id) },
  { id: 'nashik', name: 'Nashik', stateId: 'MH', regionIds: NASHIK_REGIONS.map((r) => r.id) },
  { id: 'nagpur', name: 'Nagpur', stateId: 'MH', regionIds: NAGPUR_REGIONS.map((r) => r.id) },
  { id: 'kolhapur', name: 'Kolhapur', stateId: 'MH', regionIds: KOLHAPUR_REGIONS.map((r) => r.id) },
  { id: 'solapur', name: 'Solapur', stateId: 'MH', regionIds: SOLAPUR_REGIONS.map((r) => r.id) },
  { id: 'nanded', name: 'Nanded', stateId: 'MH', regionIds: NANDED_REGIONS.map((r) => r.id) },
  { id: 'amravati', name: 'Amravati', stateId: 'MH', regionIds: AMRAVATI_REGIONS.map((r) => r.id) },
  { id: 'sangli', name: 'Sangli', stateId: 'MH', regionIds: SANGLI_REGIONS.map((r) => r.id) },
  { id: 'jalgaon', name: 'Jalgaon', stateId: 'MH', regionIds: JALGAON_REGIONS.map((r) => r.id) },
  { id: 'akola', name: 'Akola', stateId: 'MH', regionIds: AKOLA_REGIONS.map((r) => r.id) },
  { id: 'latur', name: 'Latur', stateId: 'MH', regionIds: LATUR_REGIONS.map((r) => r.id) },
  { id: 'bhopal', name: 'Bhopal', stateId: 'MP', regionIds: BHOPAL_REGIONS.map((r) => r.id) },
  { id: 'indore', name: 'Indore', stateId: 'MP', regionIds: INDORE_REGIONS.map((r) => r.id) },
  { id: 'gwalior', name: 'Gwalior', stateId: 'MP', regionIds: GWALIOR_REGIONS.map((r) => r.id) },
  { id: 'jabalpur', name: 'Jabalpur', stateId: 'MP', regionIds: JABALPUR_REGIONS.map((r) => r.id) },
  { id: 'ujjain', name: 'Ujjain', stateId: 'MP', regionIds: UJJAIN_REGIONS.map((r) => r.id) },
  { id: 'sagar', name: 'Sagar', stateId: 'MP', regionIds: SAGAR_REGIONS.map((r) => r.id) },
  { id: 'satna', name: 'Satna', stateId: 'MP', regionIds: SATNA_REGIONS.map((r) => r.id) },
  { id: 'rewa', name: 'Rewa', stateId: 'MP', regionIds: REWA_REGIONS.map((r) => r.id) },
  { id: 'jaipur', name: 'Jaipur', stateId: 'RJ', regionIds: JAIPUR_REGIONS.map((r) => r.id) },
  { id: 'jodhpur', name: 'Jodhpur', stateId: 'RJ', regionIds: JODHPUR_REGIONS.map((r) => r.id) },
  { id: 'udaipur', name: 'Udaipur', stateId: 'RJ', regionIds: UDAIPUR_REGIONS.map((r) => r.id) },
  { id: 'kota', name: 'Kota', stateId: 'RJ', regionIds: KOTA_REGIONS.map((r) => r.id) },
  { id: 'ajmer', name: 'Ajmer', stateId: 'RJ', regionIds: AJMER_REGIONS.map((r) => r.id) },
  { id: 'bikaner', name: 'Bikaner', stateId: 'RJ', regionIds: BIKANER_REGIONS.map((r) => r.id) },
  { id: 'alwar', name: 'Alwar', stateId: 'RJ', regionIds: ALWAR_REGIONS.map((r) => r.id) },
  { id: 'bharatpur', name: 'Bharatpur', stateId: 'RJ', regionIds: BHARATPUR_REGIONS.map((r) => r.id) },
  { id: 'lucknow', name: 'Lucknow', stateId: 'UP', regionIds: LUCKNOW_REGIONS.map((r) => r.id) },
  { id: 'patna', name: 'Patna', stateId: 'BR', regionIds: PATNA_REGIONS.map((r) => r.id) },
  { id: 'ranchi', name: 'Ranchi', stateId: 'JH', regionIds: RANCHI_REGIONS.map((r) => r.id) },
  { id: 'bhubaneswar', name: 'Bhubaneswar', stateId: 'OD', regionIds: BHUBANESWAR_REGIONS.map((r) => r.id) },
  { id: 'raipur', name: 'Raipur', stateId: 'CG', regionIds: RAIPUR_REGIONS.map((r) => r.id) },
  { id: 'visakhapatnam', name: 'Visakhapatnam', stateId: 'AP', regionIds: VISAKHAPATNAM_REGIONS.map((r) => r.id) },
  { id: 'gurugram', name: 'Gurugram', stateId: 'HR', regionIds: GURUGRAM_REGIONS.map((r) => r.id) },
  { id: 'kochi', name: 'Kochi', stateId: 'KL', regionIds: KOCHI_REGIONS.map((r) => r.id) },
  { id: 'ludhiana', name: 'Ludhiana', stateId: 'PB', regionIds: LUDHIANA_REGIONS.map((r) => r.id) },
  { id: 'srinagar', name: 'Srinagar', stateId: 'JK', regionIds: SRINAGAR_REGIONS.map((r) => r.id) },
  { id: 'shimla', name: 'Shimla', stateId: 'HP', regionIds: SHIMLA_REGIONS.map((r) => r.id) },
  { id: 'dehradun', name: 'Dehradun', stateId: 'UK', regionIds: DEHRADUN_REGIONS.map((r) => r.id) },
  { id: 'guwahati', name: 'Guwahati', stateId: 'AS', regionIds: GUWAHATI_REGIONS.map((r) => r.id) },
  { id: 'gangtok', name: 'Gangtok', stateId: 'SK', regionIds: GANGTOK_REGIONS.map((r) => r.id) },
  { id: 'bengaluru', name: 'Bengaluru', stateId: 'KA', regionIds: BENGALURU_REGIONS.map((r) => r.id) },
  { id: 'delhi', name: 'Delhi', stateId: 'DL', regionIds: DELHI_REGIONS.map((r) => r.id) },
  { id: 'hyderabad', name: 'Hyderabad', stateId: 'TG', regionIds: HYDERABAD_REGIONS.map((r) => r.id) },
  { id: 'chennai', name: 'Chennai', stateId: 'TN', regionIds: CHENNAI_REGIONS.map((r) => r.id) },
  { id: 'kolkata', name: 'Kolkata', stateId: 'WB', regionIds: KOLKATA_REGIONS.map((r) => r.id) },
  { id: 'ahmedabad', name: 'Ahmedabad', stateId: 'GJ', regionIds: AHMEDABAD_REGIONS.map((r) => r.id) },
];

export function getCitiesForState(stateId) { return CITIES.filter((c) => c.stateId === stateId); }
export function getCityById(cityId) { return CITIES.find((c) => c.id === cityId) || null; }
export function getStateById(stateId) { return STATES.find((s) => s.id === stateId) || null; }
export function getRegionsForCity(cityId) {
  const allRegionArrays = {
    pune: PUNE_REGIONS, mumbai: MUMBAI_REGIONS, bengaluru: BENGALURU_REGIONS,
    delhi: DELHI_REGIONS, hyderabad: HYDERABAD_REGIONS, chennai: CHENNAI_REGIONS,
    kolkata: KOLKATA_REGIONS, ahmedabad: AHMEDABAD_REGIONS,
    nashik: NASHIK_REGIONS, nagpur: NAGPUR_REGIONS, kolhapur: KOLHAPUR_REGIONS,
    solapur: SOLAPUR_REGIONS, nanded: NANDED_REGIONS, amravati: AMRAVATI_REGIONS,
    sangli: SANGLI_REGIONS, jalgaon: JALGAON_REGIONS, akola: AKOLA_REGIONS, latur: LATUR_REGIONS,
    bhopal: BHOPAL_REGIONS, indore: INDORE_REGIONS, gwalior: GWALIOR_REGIONS,
    jabalpur: JABALPUR_REGIONS, ujjain: UJJAIN_REGIONS, sagar: SAGAR_REGIONS,
    satna: SATNA_REGIONS, rewa: REWA_REGIONS,
    jaipur: JAIPUR_REGIONS, jodhpur: JODHPUR_REGIONS, udaipur: UDAIPUR_REGIONS,
    kota: KOTA_REGIONS, ajmer: AJMER_REGIONS, bikaner: BIKANER_REGIONS,
    alwar: ALWAR_REGIONS, bharatpur: BHARATPUR_REGIONS,
    lucknow: LUCKNOW_REGIONS, patna: PATNA_REGIONS, ranchi: RANCHI_REGIONS,
    bhubaneswar: BHUBANESWAR_REGIONS, raipur: RAIPUR_REGIONS,
    visakhapatnam: VISAKHAPATNAM_REGIONS, gurugram: GURUGRAM_REGIONS,
    kochi: KOCHI_REGIONS, ludhiana: LUDHIANA_REGIONS,
    srinagar: SRINAGAR_REGIONS, shimla: SHIMLA_REGIONS, dehradun: DEHRADUN_REGIONS,
    guwahati: GUWAHATI_REGIONS, gangtok: GANGTOK_REGIONS,
  };
  const source = allRegionArrays[cityId] || [];
  return source.map((r) => ({ id: r.id, name: r.id }));
}
export function getCityForRegion(regionId) {
  for (const city of CITIES) if (city.regionIds.includes(regionId)) return city;
  return null;
}
export function resolveRegionHierarchy(regionId) {
  const city = getCityForRegion(regionId);
  if (!city) return null;
  return { countryId: 'IN', stateId: city.stateId, cityId: city.id, regionId };
}