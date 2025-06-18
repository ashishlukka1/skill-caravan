import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://skill-caravan.onrender.com',
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
  error => {
    return Promise.reject(error);
  }
);

export default instance;