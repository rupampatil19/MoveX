const express = require('express');
const jwt = require('jsonwebtoken');
const Community = require('../models/Community');
const RegionalContribution = require('../models/RegionalContribution');
const User = require('../models/User');
const {
  CITY_HIERARCHY,
  getRegionsForCity,
  getRegionsForState,
} = require('../data/regionHierarchy');

const router = express.Router();

const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    const user = await User.findById(req.userId).select('accountType region');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

const ALL_REGIONS = [
  // Pune
  'Kothrud', 'Hinjewadi', 'Baner', 'Viman Nagar', 'Hadapsar', 'Shivaji Nagar', 'Pimpri',
  // Mumbai
  'Borivali', 'Andheri', 'Bandra', 'Colaba', 'Dadar', 'Powai', 'Thane',
  'Ghodbunder', 'Naupada', 'Kolshet', 'Majiwada', 'Vartak Nagar', 'Kalwa',
  'Vashi', 'Nerul', 'Belapur', 'Airoli', 'Kharghar', 'Panvel',
  // Nashik
  'Panchavati', 'Gangapur Road', 'Nashik Road', 'Satpur', 'Deolali', 'CIDCO Nashik',
  // Nagpur
  'Sitabuldi', 'Dharampeth', 'Sadar', 'Wardha Road', 'Kamptee Road', 'Manish Nagar', 'Besa',
  // Kolhapur
  'Rajarampuri', 'Shahupuri', 'Laxmipuri', 'Kasba Bawada', 'Ruikar Colony', 'Uchgaon',
  // Solapur
  'Jule Solapur', 'Vijapur Road', 'Hotgi Road', 'Akkalkot Road', 'Murarji Peth',
  // Nanded
  'Taroda', 'Vazirabad', 'Asarjan', 'CIDCO Nanded', 'Kautha',
  // Amravati
  'Rajkamal Chowk', 'Badnera Road', 'Camp Amravati', 'Sai Nagar', 'Gadge Nagar',
  // Sangli
  'Vishrambag', 'Gandhi Chowk Sangli', 'Miraj Road', 'Madhav Nagar', 'Kupwad',
  // Jalgaon
  'Ring Road', 'Nehru Chowk', 'Pimprala', 'Akashwani Chowk', 'Mehrun',
  // Akola
  'Ramdaspeth', 'Gorakshan Road', 'Old City Akola', 'MIDC Akola', 'Tapadiya Nagar',
  // Latur
  'Ausa Road', 'Barshi Road', 'Ganj Golai', 'MIDC Latur', 'Kalamb Road',
  // Bhopal
  'MP Nagar', 'Old Bhopal', 'New Market', 'Arera Colony', 'Kolar Road', 'Habibganj', 'Ayodhya Bypass',
  // Indore
  'Vijay Nagar', 'Scheme 54', 'Bicholi Mardana', 'Palasia', 'Rajwada', 'Bhawarkuan', 'Sudama Nagar',
  // Gwalior
  'Lashkar', 'Morar', 'Thatipur', 'City Center', 'Gwalior Fort', 'Hazira',
  // Jabalpur
  'Ranjhi', 'Vijay Nagar Jbp', 'Adhartal', 'Napier Town', 'Wright Town', 'Gwarighat',
  // Ujjain
  'Mahakal', 'Freeganj', 'Nanakheda', 'Dewas Gate', 'Chimanganj',
  // Sagar
  'Civil Lines Sgr', 'Tilli', 'Makronia', 'Bhagwangarh', 'Moti Nagar Sgr',
  // Satna
  'Civil Lines Sat', 'Semaria', 'Bharatpur', 'Sohawal', 'Raghurajnagar',
  // Rewa
  'Civil Lines Rewa', 'Gurh', 'Sirmour', 'Teonthar', 'Mauganj',
  // Jaipur
  'Amer', 'Pink City Jaipur', 'Jagatpura', 'Malviya Nagar Jpr', 'Mansarovar', 'C-Scheme', 'Vaishali Nagar Jpr',
  // Jodhpur
  'Mandore', 'Shastri Nagar', 'Ratanada', 'Pal Road', 'Sardarpura', 'Old City Jodhpur',
  // Udaipur
  'Sukher', 'Bhuwana', 'Sector 14', 'Hiran Magri', 'Old City Udaipur', 'Fateh Sagar',
  // Kota
  'Kunhari', 'Talwandi', 'Dadabari', 'Rajeev Gandhi Nagar', 'Gumanpura',
  // Ajmer
  'Vaishali Nagar Ajm', 'Adarsh Nagar Ajm', 'Ramganj', 'Dargah Bazaar', 'Panchsheel Nagar',
  // Bikaner
  'Junagarh', 'Gangashahar', 'Jai Narayan Vyas Colony', 'Pawanpuri', 'Rampuria',
  // Alwar
  'Moti Doongri', 'Hope Circus', 'Rajgarh Road', 'Aravali Vihar', 'Company Bagh',
  // Bharatpur
  'Krishna Nagar', 'Ganga Mandir', 'Laxman Mandir', 'Mathura Gate', 'Kotwali Bhr',
  // Lucknow
  'Aliganj', 'Gomti Nagar', 'Indira Nagar', 'Alambagh', 'Rajajipuram', 'Hazratganj', 'Aminabad',
  // Patna
  'Kankarbagh', 'Patliputra', 'Danapur', 'Boring Road', 'Rajendra Nagar', 'Kumhrar', 'Phulwari Sharif',
  // Ranchi
  'Kanke', 'Ratu Road', 'Lalpur', 'Doranda', 'Hatia', 'Harmu', 'Booty More',
  // Bhubaneswar
  'Patia', 'Chandrasekharpur', 'Jaydev Vihar', 'Old Town', 'Khandagiri', 'Nayapalli', 'Saheed Nagar',
  // Raipur
  'Mowa', 'Devendra Nagar', 'Shankar Nagar', 'Telibandha', 'Pandri', 'Amanaka', 'Kabir Nagar',
  // Visakhapatnam
  'MVP Colony', 'Madhurawada', 'Gopalapatnam', 'Dwaraka Nagar', 'Akkayyapalem', 'Gajuwaka', 'Beach Road',
  // Gurugram
  'DLF Phase 1', 'Sushant Lok', 'Sector 14', 'Palam Vihar', 'MG Road', 'Golf Course Road', 'Sohna Road',
  // Kochi
  'Fort Kochi', 'Marine Drive', 'Edappally', 'Kakkanad', 'Vyttila', 'Tripunithura', 'Thevara',
  // Ludhiana
  'Model Town', 'Sarabha Nagar', 'Haibowal Kalan', 'Focal Point', 'Jagraon Bridge', 'Dugri', 'Civil Lines',
  // Srinagar
  'Soura', 'Dal Lake', 'Sonwar', 'Rajbagh', 'Hyderpora', 'Bemina', 'Lal Chowk',
  // Shimla
  'Summer Hill', 'Kufri', 'New Shimla', 'Sanjauli', 'Chhota Shimla', 'Mall Road',
  // Dehradun
  'Rajpur Road', 'Sahastradhara', 'Race Course', 'Patel Nagar', 'Clement Town', 'Prem Nagar', 'Vasant Vihar',
  // Guwahati
  'Dispur', 'Beltola', 'Paltan Bazaar', 'Six Mile', 'Ganeshguri', 'Maligaon', 'Jalukbari',
  // Gangtok
  'MG Marg', 'Deorali', 'Tadong', 'Ranipool', 'Burtuk', 'Sichey', 'Chandmari',
  // Bengaluru
  'Koramangala', 'Whitefield', 'Indiranagar', 'HSR Layout', 'Jayanagar',
  // Delhi
  'Rohini', 'Karol Bagh', 'Chandni Chowk', 'Connaught Place', 'Lajpat Nagar', 'Saket', 'Dwarka',
  // Hyderabad
  'Mehdipatnam', 'Gachibowli', 'Kukatpally', 'Begumpet', 'Secunderabad', 'Uppal', 'LB Nagar',
  // Chennai
  'Ennore', 'Anna Nagar', 'T Nagar', 'Adyar', 'Velachery', 'Tambaram',
  // Kolkata
  'Dum Dum', 'New Town', 'Salt Lake', 'Howrah', 'Park Street', 'Ballygunge',
  // Ahmedabad
  'Gandhinagar', 'Chandkheda', 'Satellite', 'Maninagar', 'Vatva',
];

router.get('/all', auth, async (req, res) => {
  try {
    const accountType = req.user.accountType;
    const { city, state, country } = req.query;

    const query = { accountType };
    if (city) query.city = city;
    if (state) query.state = state;
    if (country) query.country = country;

    const communities = await Community.find(query);

    let scopeRegions = ALL_REGIONS;
    if (city) scopeRegions = getRegionsForCity(city);
    else if (state) scopeRegions = getRegionsForState(state);

    const existingRegions = communities.map((c) => c.region);
    const missing = scopeRegions.filter((r) => !existingRegions.includes(r));

    const missingDocs = missing.map((region) => ({
      region,
      name: region,
      totalEnergy: 0,
      powerStationLevel: 1,
      communityLevel: 1,
      powerStationCurrentEnergy: 0,
      powerStationRequiredEnergy: 20000,
      membersCount: 0,
      accountType,
      city: city || null,
      state: state || null,
      country: country || 'IN',
    }));

    res.json(
      [...communities, ...missingDocs].sort((a, b) => (b.totalEnergy || 0) - (a.totalEnergy || 0))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:region', auth, async (req, res) => {
  try {
    const community = await Community.findOne({
      region: req.params.region,
      accountType: req.user.accountType,
    });
    if (!community) {
      return res.json({
        region: req.params.region,
        name: req.params.region,
        totalEnergy: 0,
        powerStationLevel: 1,
        communityLevel: 1,
        powerStationCurrentEnergy: 0,
        powerStationRequiredEnergy: 20000,
        membersCount: 0,
        accountType: req.user.accountType,
      });
    }
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:region/leaderboard', auth, async (req, res) => {
  try {
    const leaderboard = await RegionalContribution.aggregate([
      { $match: { region: req.params.region, accountType: req.user.accountType } },
      { $group: { _id: '$userId', totalAmount: { $sum: '$amount' } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { userId: '$_id', name: '$user.name', totalAmount: 1 } },
    ]);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/aggregate', auth, async (req, res) => {
  try {
    const { level, id } = req.query;
    const accountType = req.user.accountType;

    if (!level || !id) return res.status(400).json({ error: 'level and id required' });
    if (!['city', 'state', 'country'].includes(level)) {
      return res.status(400).json({ error: 'level must be city|state|country' });
    }

    const filter = { accountType };
    if (level === 'city') filter.city = id;
    if (level === 'state') filter.state = id;
    if (level === 'country') filter.country = id;

    const communities = await Community.find(filter);
    const totalEnergy = communities.reduce((sum, c) => sum + (c.totalEnergy || 0), 0);
    const activeRegions = communities.filter((c) => (c.totalEnergy || 0) > 0).length;

    let breakdown = [];

    if (level === 'city') {
      breakdown = communities
        .map((c) => ({
          id: c.region,
          name: c.region,
          energy: c.totalEnergy || 0,
          powerStationLevel: c.powerStationLevel || 1,
        }))
        .sort((a, b) => b.energy - a.energy);
    } else if (level === 'state') {
      const cityMap = {};
      communities.forEach((c) => {
        if (!c.city) return;
        if (!cityMap[c.city]) cityMap[c.city] = { energy: 0, regions: 0 };
        cityMap[c.city].energy += c.totalEnergy || 0;
        cityMap[c.city].regions += 1;
      });
      breakdown = Object.entries(cityMap)
        .map(([cityId, info]) => ({
          id: cityId,
          name: CITY_HIERARCHY[cityId]?.name || cityId,
          energy: info.energy,
          regionCount: info.regions,
        }))
        .sort((a, b) => b.energy - a.energy);
    } else {
      const stateMap = {};
      communities.forEach((c) => {
        if (!c.state) return;
        if (!stateMap[c.state]) stateMap[c.state] = { energy: 0, cities: new Set() };
        stateMap[c.state].energy += c.totalEnergy || 0;
        if (c.city) stateMap[c.state].cities.add(c.city);
      });
      breakdown = Object.entries(stateMap)
        .map(([stateId, info]) => ({
          id: stateId,
          name: stateId,
          energy: info.energy,
          cityCount: info.cities.size,
        }))
        .sort((a, b) => b.energy - a.energy);
    }

    res.json({
      level,
      id,
      accountType,
      totalEnergy,
      activeRegions,
      regionCount: communities.length,
      breakdown,
      top: breakdown[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;