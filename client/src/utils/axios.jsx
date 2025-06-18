import axios from 'axios';

// Use environment variable for baseURL if available, fallback to production URL
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://skill-caravan.onrender.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default instance;