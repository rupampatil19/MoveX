import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

const API = axios.create({
  baseURL: BASE_URL,
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('movex_token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Global 401 handler: logout and redirect
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('movex_token');
      localStorage.removeItem('movex_user');
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;