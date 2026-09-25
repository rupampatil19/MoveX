// ============================================================
// MOVEX — Backend Region Hierarchy
// ============================================================

const REGION_HIERARCHY = {
  // ---- Pune ----
  Kothrud:         { city: 'pune', state: 'MH', country: 'IN' },
  Hinjewadi:       { city: 'pune', state: 'MH', country: 'IN' },
  Baner:           { city: 'pune', state: 'MH', country: 'IN' },
  'Shivaji Nagar': { city: 'pune', state: 'MH', country: 'IN' },
  'Viman Nagar':   { city: 'pune', state: 'MH', country: 'IN' },
  Hadapsar:        { city: 'pune', state: 'MH', country: 'IN' },
  Pimpri:          { city: 'pune', state: 'MH', country: 'IN' },

  // ---- Mumbai ----
  Thane:          { city: 'mumbai', state: 'MH', country: 'IN' },
  Powai:          { city: 'mumbai', state: 'MH', country: 'IN' },
  Borivali:       { city: 'mumbai', state: 'MH', country: 'IN' },
  Andheri:        { city: 'mumbai', state: 'MH', country: 'IN' },
  Bandra:         { city: 'mumbai', state: 'MH', country: 'IN' },
  Colaba:         { city: 'mumbai', state: 'MH', country: 'IN' },
  Dadar:          { city: 'mumbai', state: 'MH', country: 'IN' },
  Ghodbunder:     { city: 'mumbai', state: 'MH', country: 'IN' },
  Naupada:        { city: 'mumbai', state: 'MH', country: 'IN' },
  Kolshet:        { city: 'mumbai', state: 'MH', country: 'IN' },
  Majiwada:       { city: 'mumbai', state: 'MH', country: 'IN' },
  'Vartak Nagar': { city: 'mumbai', state: 'MH', country: 'IN' },
  Kalwa:          { city: 'mumbai', state: 'MH', country: 'IN' },
  Vashi:          { city: 'mumbai', state: 'MH', country: 'IN' },
  Nerul:          { city: 'mumbai', state: 'MH', country: 'IN' },
  Belapur:        { city: 'mumbai', state: 'MH', country: 'IN' },
  Airoli:         { city: 'mumbai', state: 'MH', country: 'IN' },
  Kharghar:       { city: 'mumbai', state: 'MH', country: 'IN' },
  Panvel:         { city: 'mumbai', state: 'MH', country: 'IN' },

  // ---- Nashik ----
  Panchavati:      { city: 'nashik', state: 'MH', country: 'IN' },
  'Gangapur Road': { city: 'nashik', state: 'MH', country: 'IN' },
  'Nashik Road':   { city: 'nashik', state: 'MH', country: 'IN' },
  Satpur:          { city: 'nashik', state: 'MH', country: 'IN' },
  Deolali:         { city: 'nashik', state: 'MH', country: 'IN' },
  'CIDCO Nashik':  { city: 'nashik', state: 'MH', country: 'IN' },

  // ---- Nagpur ----
  Sitabuldi:      { city: 'nagpur', state: 'MH', country: 'IN' },
  Dharampeth:     { city: 'nagpur', state: 'MH', country: 'IN' },
  Sadar:          { city: 'nagpur', state: 'MH', country: 'IN' },
  'Wardha Road':  { city: 'nagpur', state: 'MH', country: 'IN' },
  'Kamptee Road': { city: 'nagpur', state: 'MH', country: 'IN' },
  'Manish Nagar': { city: 'nagpur', state: 'MH', country: 'IN' },
  Besa:           { city: 'nagpur', state: 'MH', country: 'IN' },

  // ---- Kolhapur ----
  Rajarampuri:     { city: 'kolhapur', state: 'MH', country: 'IN' },
  Shahupuri:       { city: 'kolhapur', state: 'MH', country: 'IN' },
  Laxmipuri:       { city: 'kolhapur', state: 'MH', country: 'IN' },
  'Kasba Bawada':  { city: 'kolhapur', state: 'MH', country: 'IN' },
  'Ruikar Colony': { city: 'kolhapur', state: 'MH', country: 'IN' },
  Uchgaon:         { city: 'kolhapur', state: 'MH', country: 'IN' },

  // ---- Solapur ----
  'Jule Solapur':  { city: 'solapur', state: 'MH', country: 'IN' },
  'Vijapur Road':  { city: 'solapur', state: 'MH', country: 'IN' },
  'Hotgi Road':    { city: 'solapur', state: 'MH', country: 'IN' },
  'Akkalkot Road': { city: 'solapur', state: 'MH', country: 'IN' },
  'Murarji Peth':  { city: 'solapur', state: 'MH', country: 'IN' },

  // ---- Nanded ----
  Taroda:         { city: 'nanded', state: 'MH', country: 'IN' },
  Vazirabad:      { city: 'nanded', state: 'MH', country: 'IN' },
  Asarjan:        { city: 'nanded', state: 'MH', country: 'IN' },
  'CIDCO Nanded': { city: 'nanded', state: 'MH', country: 'IN' },
  Kautha:         { city: 'nanded', state: 'MH', country: 'IN' },

  // ---- Amravati ----
  'Rajkamal Chowk': { city: 'amravati', state: 'MH', country: 'IN' },
  'Badnera Road':   { city: 'amravati', state: 'MH', country: 'IN' },
  'Camp Amravati':  { city: 'amravati', state: 'MH', country: 'IN' },
  'Sai Nagar':      { city: 'amravati', state: 'MH', country: 'IN' },
  'Gadge Nagar':    { city: 'amravati', state: 'MH', country: 'IN' },

  // ---- Sangli ----
  Vishrambag:            { city: 'sangli', state: 'MH', country: 'IN' },
  'Gandhi Chowk Sangli': { city: 'sangli', state: 'MH', country: 'IN' },
  'Miraj Road':          { city: 'sangli', state: 'MH', country: 'IN' },
  'Madhav Nagar':        { city: 'sangli', state: 'MH', country: 'IN' },
  Kupwad:                { city: 'sangli', state: 'MH', country: 'IN' },

  // ---- Jalgaon ----
  'Ring Road':       { city: 'jalgaon', state: 'MH', country: 'IN' },
  'Nehru Chowk':     { city: 'jalgaon', state: 'MH', country: 'IN' },
  Pimprala:          { city: 'jalgaon', state: 'MH', country: 'IN' },
  'Akashwani Chowk': { city: 'jalgaon', state: 'MH', country: 'IN' },
  Mehrun:            { city: 'jalgaon', state: 'MH', country: 'IN' },

  // ---- Akola ----
  Ramdaspeth:       { city: 'akola', state: 'MH', country: 'IN' },
  'Gorakshan Road': { city: 'akola', state: 'MH', country: 'IN' },
  'Old City Akola': { city: 'akola', state: 'MH', country: 'IN' },
  'MIDC Akola':     { city: 'akola', state: 'MH', country: 'IN' },
  'Tapadiya Nagar': { city: 'akola', state: 'MH', country: 'IN' },

  // ---- Latur ----
  'Ausa Road':   { city: 'latur', state: 'MH', country: 'IN' },
  'Barshi Road': { city: 'latur', state: 'MH', country: 'IN' },
  'Ganj Golai':  { city: 'latur', state: 'MH', country: 'IN' },
  'MIDC Latur':  { city: 'latur', state: 'MH', country: 'IN' },
  'Kalamb Road': { city: 'latur', state: 'MH', country: 'IN' },

  // ---- Bhopal ----
  'MP Nagar':       { city: 'bhopal', state: 'MP', country: 'IN' },
  'Old Bhopal':     { city: 'bhopal', state: 'MP', country: 'IN' },
  'New Market':     { city: 'bhopal', state: 'MP', country: 'IN' },
  'Arera Colony':   { city: 'bhopal', state: 'MP', country: 'IN' },
  'Kolar Road':     { city: 'bhopal', state: 'MP', country: 'IN' },
  Habibganj:        { city: 'bhopal', state: 'MP', country: 'IN' },
  'Ayodhya Bypass': { city: 'bhopal', state: 'MP', country: 'IN' },

  // ---- Indore ----
  'Vijay Nagar':     { city: 'indore', state: 'MP', country: 'IN' },
  'Scheme 54':       { city: 'indore', state: 'MP', country: 'IN' },
  'Bicholi Mardana': { city: 'indore', state: 'MP', country: 'IN' },
  Palasia:           { city: 'indore', state: 'MP', country: 'IN' },
  Rajwada:           { city: 'indore', state: 'MP', country: 'IN' },
  Bhawarkuan:        { city: 'indore', state: 'MP', country: 'IN' },
  'Sudama Nagar':    { city: 'indore', state: 'MP', country: 'IN' },

  // ---- Gwalior ----
  Lashkar:        { city: 'gwalior', state: 'MP', country: 'IN' },
  Morar:          { city: 'gwalior', state: 'MP', country: 'IN' },
  Thatipur:       { city: 'gwalior', state: 'MP', country: 'IN' },
  'City Center':  { city: 'gwalior', state: 'MP', country: 'IN' },
  'Gwalior Fort': { city: 'gwalior', state: 'MP', country: 'IN' },
  Hazira:         { city: 'gwalior', state: 'MP', country: 'IN' },

  // ---- Jabalpur ----
  Ranjhi:            { city: 'jabalpur', state: 'MP', country: 'IN' },
  'Vijay Nagar Jbp': { city: 'jabalpur', state: 'MP', country: 'IN' },
  Adhartal:          { city: 'jabalpur', state: 'MP', country: 'IN' },
  'Napier Town':     { city: 'jabalpur', state: 'MP', country: 'IN' },
  'Wright Town':     { city: 'jabalpur', state: 'MP', country: 'IN' },
  Gwarighat:         { city: 'jabalpur', state: 'MP', country: 'IN' },

  // ---- Ujjain ----
  Mahakal:     { city: 'ujjain', state: 'MP', country: 'IN' },
  Freeganj:    { city: 'ujjain', state: 'MP', country: 'IN' },
  Nanakheda:   { city: 'ujjain', state: 'MP', country: 'IN' },
  'Dewas Gate': { city: 'ujjain', state: 'MP', country: 'IN' },
  Chimanganj:  { city: 'ujjain', state: 'MP', country: 'IN' },

  // ---- Sagar ----
  'Civil Lines Sgr': { city: 'sagar', state: 'MP', country: 'IN' },
  Tilli:             { city: 'sagar', state: 'MP', country: 'IN' },
  Makronia:          { city: 'sagar', state: 'MP', country: 'IN' },
  Bhagwangarh:       { city: 'sagar', state: 'MP', country: 'IN' },
  'Moti Nagar Sgr':  { city: 'sagar', state: 'MP', country: 'IN' },

  // ---- Satna ----
  'Civil Lines Sat': { city: 'satna', state: 'MP', country: 'IN' },
  Semaria:           { city: 'satna', state: 'MP', country: 'IN' },
  Bharatpur:         { city: 'satna', state: 'MP', country: 'IN' },
  Sohawal:           { city: 'satna', state: 'MP', country: 'IN' },
  Raghurajnagar:     { city: 'satna', state: 'MP', country: 'IN' },

  // ---- Rewa ----
  'Civil Lines Rewa': { city: 'rewa', state: 'MP', country: 'IN' },
  Gurh:               { city: 'rewa', state: 'MP', country: 'IN' },
  Sirmour:            { city: 'rewa', state: 'MP', country: 'IN' },
  Teonthar:           { city: 'rewa', state: 'MP', country: 'IN' },
  Mauganj:            { city: 'rewa', state: 'MP', country: 'IN' },

  // ---- Jaipur ----
  Amer:               { city: 'jaipur', state: 'RJ', country: 'IN' },
  'Pink City Jaipur': { city: 'jaipur', state: 'RJ', country: 'IN' },
  Jagatpura:          { city: 'jaipur', state: 'RJ', country: 'IN' },
  'Malviya Nagar Jpr': { city: 'jaipur', state: 'RJ', country: 'IN' },
  Mansarovar:         { city: 'jaipur', state: 'RJ', country: 'IN' },
  'C-Scheme':         { city: 'jaipur', state: 'RJ', country: 'IN' },
  'Vaishali Nagar Jpr': { city: 'jaipur', state: 'RJ', country: 'IN' },

  // ---- Jodhpur ----
  Mandore:          { city: 'jodhpur', state: 'RJ', country: 'IN' },
  'Shastri Nagar':  { city: 'jodhpur', state: 'RJ', country: 'IN' },
  Ratanada:         { city: 'jodhpur', state: 'RJ', country: 'IN' },
  'Pal Road':       { city: 'jodhpur', state: 'RJ', country: 'IN' },
  Sardarpura:       { city: 'jodhpur', state: 'RJ', country: 'IN' },
  'Old City Jodhpur': { city: 'jodhpur', state: 'RJ', country: 'IN' },

  // ---- Udaipur ----
  Sukher:           { city: 'udaipur', state: 'RJ', country: 'IN' },
  Bhuwana:          { city: 'udaipur', state: 'RJ', country: 'IN' },
  'Sector 14':      { city: 'udaipur', state: 'RJ', country: 'IN' },
  'Hiran Magri':    { city: 'udaipur', state: 'RJ', country: 'IN' },
  'Old City Udaipur': { city: 'udaipur', state: 'RJ', country: 'IN' },
  'Fateh Sagar':    { city: 'udaipur', state: 'RJ', country: 'IN' },

  // ---- Kota ----
  Kunhari:             { city: 'kota', state: 'RJ', country: 'IN' },
  Talwandi:            { city: 'kota', state: 'RJ', country: 'IN' },
  Dadabari:            { city: 'kota', state: 'RJ', country: 'IN' },
  'Rajeev Gandhi Nagar': { city: 'kota', state: 'RJ', country: 'IN' },
  Gumanpura:           { city: 'kota', state: 'RJ', country: 'IN' },

  // ---- Ajmer ----
  'Vaishali Nagar Ajm': { city: 'ajmer', state: 'RJ', country: 'IN' },
  'Adarsh Nagar Ajm':   { city: 'ajmer', state: 'RJ', country: 'IN' },
  Ramganj:              { city: 'ajmer', state: 'RJ', country: 'IN' },
  'Dargah Bazaar':      { city: 'ajmer', state: 'RJ', country: 'IN' },
  'Panchsheel Nagar':   { city: 'ajmer', state: 'RJ', country: 'IN' },

  // ---- Bikaner ----
  Junagarh:                 { city: 'bikaner', state: 'RJ', country: 'IN' },
  Gangashahar:              { city: 'bikaner', state: 'RJ', country: 'IN' },
  'Jai Narayan Vyas Colony': { city: 'bikaner', state: 'RJ', country: 'IN' },
  Pawanpuri:                { city: 'bikaner', state: 'RJ', country: 'IN' },
  Rampuria:                 { city: 'bikaner', state: 'RJ', country: 'IN' },

  // ---- Alwar ----
  'Moti Doongri':  { city: 'alwar', state: 'RJ', country: 'IN' },
  'Hope Circus':   { city: 'alwar', state: 'RJ', country: 'IN' },
  'Rajgarh Road':  { city: 'alwar', state: 'RJ', country: 'IN' },
  'Aravali Vihar': { city: 'alwar', state: 'RJ', country: 'IN' },
  'Company Bagh':  { city: 'alwar', state: 'RJ', country: 'IN' },

  // ---- Bharatpur ----
  'Krishna Nagar': { city: 'bharatpur', state: 'RJ', country: 'IN' },
  'Ganga Mandir':  { city: 'bharatpur', state: 'RJ', country: 'IN' },
  'Laxman Mandir': { city: 'bharatpur', state: 'RJ', country: 'IN' },
  'Mathura Gate':  { city: 'bharatpur', state: 'RJ', country: 'IN' },
  'Kotwali Bhr':   { city: 'bharatpur', state: 'RJ', country: 'IN' },

  // ---- Lucknow ----
  Aliganj:       { city: 'lucknow', state: 'UP', country: 'IN' },
  'Gomti Nagar': { city: 'lucknow', state: 'UP', country: 'IN' },
  'Indira Nagar': { city: 'lucknow', state: 'UP', country: 'IN' },
  Alambagh:      { city: 'lucknow', state: 'UP', country: 'IN' },
  Rajajipuram:   { city: 'lucknow', state: 'UP', country: 'IN' },
  Hazratganj:    { city: 'lucknow', state: 'UP', country: 'IN' },
  Aminabad:      { city: 'lucknow', state: 'UP', country: 'IN' },

  // ---- Patna ----
  Kankarbagh:      { city: 'patna', state: 'BR', country: 'IN' },
  Patliputra:      { city: 'patna', state: 'BR', country: 'IN' },
  Danapur:         { city: 'patna', state: 'BR', country: 'IN' },
  'Boring Road':   { city: 'patna', state: 'BR', country: 'IN' },
  'Rajendra Nagar': { city: 'patna', state: 'BR', country: 'IN' },
  Kumhrar:         { city: 'patna', state: 'BR', country: 'IN' },
  'Phulwari Sharif': { city: 'patna', state: 'BR', country: 'IN' },

  // ---- Ranchi ----
  Kanke:      { city: 'ranchi', state: 'JH', country: 'IN' },
  'Ratu Road': { city: 'ranchi', state: 'JH', country: 'IN' },
  Lalpur:     { city: 'ranchi', state: 'JH', country: 'IN' },
  Doranda:    { city: 'ranchi', state: 'JH', country: 'IN' },
  Hatia:      { city: 'ranchi', state: 'JH', country: 'IN' },
  Harmu:      { city: 'ranchi', state: 'JH', country: 'IN' },
  'Booty More': { city: 'ranchi', state: 'JH', country: 'IN' },

  // ---- Bhubaneswar ----
  Patia:            { city: 'bhubaneswar', state: 'OD', country: 'IN' },
  Chandrasekharpur: { city: 'bhubaneswar', state: 'OD', country: 'IN' },
  'Jaydev Vihar':   { city: 'bhubaneswar', state: 'OD', country: 'IN' },
  'Old Town':       { city: 'bhubaneswar', state: 'OD', country: 'IN' },
  Khandagiri:       { city: 'bhubaneswar', state: 'OD', country: 'IN' },
  Nayapalli:        { city: 'bhubaneswar', state: 'OD', country: 'IN' },
  'Saheed Nagar':   { city: 'bhubaneswar', state: 'OD', country: 'IN' },

  // ---- Raipur ----
  Mowa:            { city: 'raipur', state: 'CG', country: 'IN' },
  'Devendra Nagar': { city: 'raipur', state: 'CG', country: 'IN' },
  'Shankar Nagar':  { city: 'raipur', state: 'CG', country: 'IN' },
  Telibandha:      { city: 'raipur', state: 'CG', country: 'IN' },
  Pandri:          { city: 'raipur', state: 'CG', country: 'IN' },
  Amanaka:         { city: 'raipur', state: 'CG', country: 'IN' },
  'Kabir Nagar':   { city: 'raipur', state: 'CG', country: 'IN' },

  // ---- Visakhapatnam ----
  'MVP Colony':    { city: 'visakhapatnam', state: 'AP', country: 'IN' },
  Madhurawada:     { city: 'visakhapatnam', state: 'AP', country: 'IN' },
  Gopalapatnam:    { city: 'visakhapatnam', state: 'AP', country: 'IN' },
  'Dwaraka Nagar': { city: 'visakhapatnam', state: 'AP', country: 'IN' },
  Akkayyapalem:    { city: 'visakhapatnam', state: 'AP', country: 'IN' },
  Gajuwaka:        { city: 'visakhapatnam', state: 'AP', country: 'IN' },
  'Beach Road':    { city: 'visakhapatnam', state: 'AP', country: 'IN' },

  // ---- Gurugram ----
  'DLF Phase 1':      { city: 'gurugram', state: 'HR', country: 'IN' },
  'Sushant Lok':      { city: 'gurugram', state: 'HR', country: 'IN' },
  'Sector 14':        { city: 'gurugram', state: 'HR', country: 'IN' },
  'Palam Vihar':      { city: 'gurugram', state: 'HR', country: 'IN' },
  'MG Road':          { city: 'gurugram', state: 'HR', country: 'IN' },
  'Golf Course Road': { city: 'gurugram', state: 'HR', country: 'IN' },
  'Sohna Road':       { city: 'gurugram', state: 'HR', country: 'IN' },

  // ---- Kochi ----
  'Fort Kochi':   { city: 'kochi', state: 'KL', country: 'IN' },
  'Marine Drive': { city: 'kochi', state: 'KL', country: 'IN' },
  Edappally:      { city: 'kochi', state: 'KL', country: 'IN' },
  Kakkanad:       { city: 'kochi', state: 'KL', country: 'IN' },
  Vyttila:        { city: 'kochi', state: 'KL', country: 'IN' },
  Tripunithura:   { city: 'kochi', state: 'KL', country: 'IN' },
  Thevara:        { city: 'kochi', state: 'KL', country: 'IN' },

  // ---- Ludhiana ----
  'Model Town':     { city: 'ludhiana', state: 'PB', country: 'IN' },
  'Sarabha Nagar':  { city: 'ludhiana', state: 'PB', country: 'IN' },
  'Haibowal Kalan': { city: 'ludhiana', state: 'PB', country: 'IN' },
  'Focal Point':    { city: 'ludhiana', state: 'PB', country: 'IN' },
  'Jagraon Bridge': { city: 'ludhiana', state: 'PB', country: 'IN' },
  Dugri:            { city: 'ludhiana', state: 'PB', country: 'IN' },
  'Civil Lines':    { city: 'ludhiana', state: 'PB', country: 'IN' },

  // ---- Srinagar ----
  Soura:      { city: 'srinagar', state: 'JK', country: 'IN' },
  'Dal Lake': { city: 'srinagar', state: 'JK', country: 'IN' },
  Sonwar:     { city: 'srinagar', state: 'JK', country: 'IN' },
  Rajbagh:    { city: 'srinagar', state: 'JK', country: 'IN' },
  Hyderpora:  { city: 'srinagar', state: 'JK', country: 'IN' },
  Bemina:     { city: 'srinagar', state: 'JK', country: 'IN' },
  'Lal Chowk': { city: 'srinagar', state: 'JK', country: 'IN' },

  // ---- Shimla ----
  'Summer Hill':   { city: 'shimla', state: 'HP', country: 'IN' },
  Kufri:           { city: 'shimla', state: 'HP', country: 'IN' },
  'New Shimla':    { city: 'shimla', state: 'HP', country: 'IN' },
  Sanjauli:        { city: 'shimla', state: 'HP', country: 'IN' },
  'Chhota Shimla': { city: 'shimla', state: 'HP', country: 'IN' },
  'Mall Road':     { city: 'shimla', state: 'HP', country: 'IN' },

  // ---- Dehradun ----
  'Rajpur Road':   { city: 'dehradun', state: 'UK', country: 'IN' },
  Sahastradhara:   { city: 'dehradun', state: 'UK', country: 'IN' },
  'Race Course':   { city: 'dehradun', state: 'UK', country: 'IN' },
  'Patel Nagar':   { city: 'dehradun', state: 'UK', country: 'IN' },
  'Clement Town':  { city: 'dehradun', state: 'UK', country: 'IN' },
  'Prem Nagar':    { city: 'dehradun', state: 'UK', country: 'IN' },
  'Vasant Vihar':  { city: 'dehradun', state: 'UK', country: 'IN' },

  // ---- Guwahati ----
  Dispur:          { city: 'guwahati', state: 'AS', country: 'IN' },
  Beltola:         { city: 'guwahati', state: 'AS', country: 'IN' },
  'Paltan Bazaar': { city: 'guwahati', state: 'AS', country: 'IN' },
  'Six Mile':      { city: 'guwahati', state: 'AS', country: 'IN' },
  Ganeshguri:      { city: 'guwahati', state: 'AS', country: 'IN' },
  Maligaon:        { city: 'guwahati', state: 'AS', country: 'IN' },
  Jalukbari:       { city: 'guwahati', state: 'AS', country: 'IN' },

  // ---- Gangtok ----
  'MG Marg':   { city: 'gangtok', state: 'SK', country: 'IN' },
  Deorali:     { city: 'gangtok', state: 'SK', country: 'IN' },
  Tadong:      { city: 'gangtok', state: 'SK', country: 'IN' },
  Ranipool:    { city: 'gangtok', state: 'SK', country: 'IN' },
  Burtuk:      { city: 'gangtok', state: 'SK', country: 'IN' },
  Sichey:      { city: 'gangtok', state: 'SK', country: 'IN' },
  Chandmari:   { city: 'gangtok', state: 'SK', country: 'IN' },

  // ---- Bengaluru ----
  Koramangala:  { city: 'bengaluru', state: 'KA', country: 'IN' },
  Whitefield:   { city: 'bengaluru', state: 'KA', country: 'IN' },
  Indiranagar:  { city: 'bengaluru', state: 'KA', country: 'IN' },
  'HSR Layout': { city: 'bengaluru', state: 'KA', country: 'IN' },
  Jayanagar:    { city: 'bengaluru', state: 'KA', country: 'IN' },

  // ---- Delhi ----
  Rohini:            { city: 'delhi', state: 'DL', country: 'IN' },
  'Karol Bagh':      { city: 'delhi', state: 'DL', country: 'IN' },
  'Chandni Chowk':   { city: 'delhi', state: 'DL', country: 'IN' },
  'Connaught Place': { city: 'delhi', state: 'DL', country: 'IN' },
  'Lajpat Nagar':    { city: 'delhi', state: 'DL', country: 'IN' },
  Saket:             { city: 'delhi', state: 'DL', country: 'IN' },
  Dwarka:            { city: 'delhi', state: 'DL', country: 'IN' },

  // ---- Hyderabad ----
  Mehdipatnam:  { city: 'hyderabad', state: 'TG', country: 'IN' },
  Gachibowli:   { city: 'hyderabad', state: 'TG', country: 'IN' },
  Kukatpally:   { city: 'hyderabad', state: 'TG', country: 'IN' },
  Begumpet:     { city: 'hyderabad', state: 'TG', country: 'IN' },
  Secunderabad: { city: 'hyderabad', state: 'TG', country: 'IN' },
  Uppal:        { city: 'hyderabad', state: 'TG', country: 'IN' },
  'LB Nagar':   { city: 'hyderabad', state: 'TG', country: 'IN' },

  // ---- Chennai ----
  Ennore:       { city: 'chennai', state: 'TN', country: 'IN' },
  'Anna Nagar': { city: 'chennai', state: 'TN', country: 'IN' },
  'T Nagar':    { city: 'chennai', state: 'TN', country: 'IN' },
  Adyar:        { city: 'chennai', state: 'TN', country: 'IN' },
  Velachery:    { city: 'chennai', state: 'TN', country: 'IN' },
  Tambaram:     { city: 'chennai', state: 'TN', country: 'IN' },

  // ---- Kolkata ----
  'Dum Dum':     { city: 'kolkata', state: 'WB', country: 'IN' },
  'New Town':    { city: 'kolkata', state: 'WB', country: 'IN' },
  'Salt Lake':   { city: 'kolkata', state: 'WB', country: 'IN' },
  Howrah:        { city: 'kolkata', state: 'WB', country: 'IN' },
  'Park Street': { city: 'kolkata', state: 'WB', country: 'IN' },
  Ballygunge:    { city: 'kolkata', state: 'WB', country: 'IN' },

  // ---- Ahmedabad ----
  Gandhinagar: { city: 'ahmedabad', state: 'GJ', country: 'IN' },
  Chandkheda:  { city: 'ahmedabad', state: 'GJ', country: 'IN' },
  Satellite:   { city: 'ahmedabad', state: 'GJ', country: 'IN' },
  Maninagar:   { city: 'ahmedabad', state: 'GJ', country: 'IN' },
  Vatva:       { city: 'ahmedabad', state: 'GJ', country: 'IN' },
};

const CITY_HIERARCHY = {
  pune:          { state: 'MH', country: 'IN', name: 'Pune' },
  mumbai:        { state: 'MH', country: 'IN', name: 'Mumbai' },
  nashik:        { state: 'MH', country: 'IN', name: 'Nashik' },
  nagpur:        { state: 'MH', country: 'IN', name: 'Nagpur' },
  kolhapur:      { state: 'MH', country: 'IN', name: 'Kolhapur' },
  solapur:       { state: 'MH', country: 'IN', name: 'Solapur' },
  nanded:        { state: 'MH', country: 'IN', name: 'Nanded' },
  amravati:      { state: 'MH', country: 'IN', name: 'Amravati' },
  sangli:        { state: 'MH', country: 'IN', name: 'Sangli' },
  jalgaon:       { state: 'MH', country: 'IN', name: 'Jalgaon' },
  akola:         { state: 'MH', country: 'IN', name: 'Akola' },
  latur:         { state: 'MH', country: 'IN', name: 'Latur' },

  bhopal:    { state: 'MP', country: 'IN', name: 'Bhopal' },
  indore:    { state: 'MP', country: 'IN', name: 'Indore' },
  gwalior:   { state: 'MP', country: 'IN', name: 'Gwalior' },
  jabalpur:  { state: 'MP', country: 'IN', name: 'Jabalpur' },
  ujjain:    { state: 'MP', country: 'IN', name: 'Ujjain' },
  sagar:     { state: 'MP', country: 'IN', name: 'Sagar' },
  satna:     { state: 'MP', country: 'IN', name: 'Satna' },
  rewa:      { state: 'MP', country: 'IN', name: 'Rewa' },

  jaipur:    { state: 'RJ', country: 'IN', name: 'Jaipur' },
  jodhpur:   { state: 'RJ', country: 'IN', name: 'Jodhpur' },
  udaipur:   { state: 'RJ', country: 'IN', name: 'Udaipur' },
  kota:      { state: 'RJ', country: 'IN', name: 'Kota' },
  ajmer:     { state: 'RJ', country: 'IN', name: 'Ajmer' },
  bikaner:   { state: 'RJ', country: 'IN', name: 'Bikaner' },
  alwar:     { state: 'RJ', country: 'IN', name: 'Alwar' },
  bharatpur: { state: 'RJ', country: 'IN', name: 'Bharatpur' },

  lucknow:   { state: 'UP', country: 'IN', name: 'Lucknow' },
  patna:     { state: 'BR', country: 'IN', name: 'Patna' },
  ranchi:    { state: 'JH', country: 'IN', name: 'Ranchi' },
  bhubaneswar: { state: 'OD', country: 'IN', name: 'Bhubaneswar' },
  raipur:    { state: 'CG', country: 'IN', name: 'Raipur' },
  visakhapatnam: { state: 'AP', country: 'IN', name: 'Visakhapatnam' },
  gurugram:  { state: 'HR', country: 'IN', name: 'Gurugram' },
  kochi:     { state: 'KL', country: 'IN', name: 'Kochi' },
  ludhiana:  { state: 'PB', country: 'IN', name: 'Ludhiana' },
  srinagar:  { state: 'JK', country: 'IN', name: 'Srinagar' },
  shimla:    { state: 'HP', country: 'IN', name: 'Shimla' },
  dehradun:  { state: 'UK', country: 'IN', name: 'Dehradun' },
  guwahati:  { state: 'AS', country: 'IN', name: 'Guwahati' },
  gangtok:   { state: 'SK', country: 'IN', name: 'Gangtok' },
  bengaluru: { state: 'KA', country: 'IN', name: 'Bengaluru' },
  delhi:     { state: 'DL', country: 'IN', name: 'Delhi' },
  hyderabad: { state: 'TG', country: 'IN', name: 'Hyderabad' },
  chennai:   { state: 'TN', country: 'IN', name: 'Chennai' },
  kolkata:   { state: 'WB', country: 'IN', name: 'Kolkata' },
  ahmedabad: { state: 'GJ', country: 'IN', name: 'Ahmedabad' },
};

const STATE_HIERARCHY = {
  MH: { country: 'IN', name: 'Maharashtra' },
  MP: { country: 'IN', name: 'Madhya Pradesh' },
  RJ: { country: 'IN', name: 'Rajasthan' },
  UP: { country: 'IN', name: 'Uttar Pradesh' },
  BR: { country: 'IN', name: 'Bihar' },
  JH: { country: 'IN', name: 'Jharkhand' },
  OD: { country: 'IN', name: 'Odisha' },
  CG: { country: 'IN', name: 'Chhattisgarh' },
  AP: { country: 'IN', name: 'Andhra Pradesh' },
  HR: { country: 'IN', name: 'Haryana' },
  KL: { country: 'IN', name: 'Kerala' },
  PB: { country: 'IN', name: 'Punjab' },
  JK: { country: 'IN', name: 'Jammu & Kashmir' },
  HP: { country: 'IN', name: 'Himachal Pradesh' },
  UK: { country: 'IN', name: 'Uttarakhand' },
  AS: { country: 'IN', name: 'Assam' },
  KA: { country: 'IN', name: 'Karnataka' },
  SK: { country: 'IN', name: 'Sikkim' },
  DL: { country: 'IN', name: 'Delhi' },
  TG: { country: 'IN', name: 'Telangana' },
  TN: { country: 'IN', name: 'Tamil Nadu' },
  WB: { country: 'IN', name: 'West Bengal' },
  GJ: { country: 'IN', name: 'Gujarat' },
};

function getHierarchy(regionId) {
  return REGION_HIERARCHY[regionId] || { city: null, state: null, country: 'IN' };
}
function getCityInfo(cityId) { return CITY_HIERARCHY[cityId] || null; }
function getStateInfo(stateId) { return STATE_HIERARCHY[stateId] || null; }
function getRegionsForCity(cityId) {
  return Object.entries(REGION_HIERARCHY)
    .filter(([, h]) => h.city === cityId)
    .map(([regionId]) => regionId);
}
function getRegionsForState(stateId) {
  return Object.entries(REGION_HIERARCHY)
    .filter(([, h]) => h.state === stateId)
    .map(([regionId]) => regionId);
}

const PUBLIC_STATES = [
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

const PUBLIC_CITIES = Object.entries(CITY_HIERARCHY).map(([cityId, info]) => ({
  id: cityId,
  name: info.name,
  stateId: info.state,
  regionIds: getRegionsForCity(cityId),
}));

function isValidCombination(stateId, cityId, regionId) {
  const city = CITY_HIERARCHY[cityId];
  if (!city) return false;
  if (city.state !== stateId) return false;
  const region = REGION_HIERARCHY[regionId];
  if (!region) return false;
  if (region.city !== cityId) return false;
  if (region.state !== stateId) return false;
  return true;
}

function resolveRegionHierarchy(regionId) {
  const r = REGION_HIERARCHY[regionId];
  if (!r) return null;
  return {
    countryId: r.country || 'IN',
    stateId: r.state,
    cityId: r.city,
    regionId,
  };
}
// Mirror of frontend's building-level names (used by notifications)
const HUB_LEVEL_NAMES = {
  1: 'Tide Hut',
  2: 'Wave Dock',
  3: 'Aqua Bastion',
  4: 'Ocean Citadel',
  5: "Poseidon's Hub",
};

function getHubName(level) {
  const safe = Math.min(Math.max(Number(level) || 1, 1), 5);
  return HUB_LEVEL_NAMES[safe];
}
module.exports = {
  REGION_HIERARCHY,
  CITY_HIERARCHY,
  STATE_HIERARCHY,
  getHierarchy,
  getCityInfo,
  getStateInfo,
  getRegionsForCity,
  getRegionsForState,
  PUBLIC_STATES,
  PUBLIC_CITIES,
  isValidCombination,
  resolveRegionHierarchy,
  getHubName,
};