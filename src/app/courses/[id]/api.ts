import axios from 'axios';
import authService from '@/lib/api/authService';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.orgapi',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;