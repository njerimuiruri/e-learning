import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const api = axios.create({
  baseURL: `${API_URL}/api/drafts`,
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

const draftService = {
  save: async (draftKey: string, payload: {
    contentType: string;
    data: any;
    entityId?: string;
    title?: string;
  }) => {
    const { data } = await api.put(`/${draftKey}`, payload);
    return data;
  },

  get: async (draftKey: string) => {
    const { data } = await api.get(`/${draftKey}`);
    return data;
  },

  list: async () => {
    const { data } = await api.get('/');
    return data;
  },

  discard: async (draftKey: string) => {
    const { data } = await api.delete(`/${draftKey}`);
    return data;
  },
};

export default draftService;
