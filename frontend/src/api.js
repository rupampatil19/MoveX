import axios from 'axios';

// Dynamic base URL: uses the same hostname the frontend is served from.
// Works for localhost (desktop) and local IP (mobile) automatically.
const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

const API = axios.create({
  baseURL: BASE_URL
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('movex_token');
  if (token) config.headers['x-auth-token'] = token;
  return config;
});

export default API;