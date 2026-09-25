const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  region: {
    type: String,
    enum: [
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
    ],
    default: 'Kothrud',
  },

  stateId:   { type: String, default: null },
  cityId:    { type: String, default: null },
  countryId: { type: String, default: 'IN' },

  accountType: { type: String, enum: ['BEGINNER', 'PRO'], default: 'BEGINNER' },
  totalDistance: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  energy: { type: Number, default: 0 },

  trophies: { type: [String], default: [] },
  trophyPoints: { type: Number, default: 0, min: 0 },

  streak: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: null },
  dailyQuestProgress: { type: Number, default: 0 },
  dailyQuestCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);