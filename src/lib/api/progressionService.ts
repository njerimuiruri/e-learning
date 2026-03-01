import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const api = axios.create({
  baseURL: `${API_URL}/progression`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const progressionService = {
  async getProgressionForCategory(categoryId) {
    const response = await api.get(`/category/${categoryId}`);
    return response.data;
  },

  async checkLevelAccess(categoryId, level) {
    const response = await api.get(`/category/${categoryId}/level/${level}/access`);
    return response.data;
  },

  async getMyProgressions() {
    const response = await api.get('/my-progressions');
    return response.data;
  },
};

export default progressionService;
