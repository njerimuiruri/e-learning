import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const whiteboardService = {
  create: async (title: string, pages: any[][], textLayers: any[][]) => {
    const res = await api.post('/whiteboards', { title, pages, textLayers });
    return res.data.data;
  },

  getMyWhiteboards: async () => {
    const res = await api.get('/whiteboards/my');
    return res.data.data || [];
  },

  getById: async (id: string) => {
    const res = await api.get(`/whiteboards/${id}`);
    return res.data.data;
  },

  update: async (id: string, title: string, pages: any[][], textLayers: any[][]) => {
    const res = await api.put(`/whiteboards/${id}`, { title, pages, textLayers });
    return res.data.data;
  },

  share: async (id: string, categoryIds: string[]) => {
    const res = await api.post(`/whiteboards/${id}/share`, { categoryIds });
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/whiteboards/${id}`);
    return res.data;
  },

  getSharedForCategory: async (categoryId: string) => {
    const res = await api.get(`/whiteboards/shared/category/${categoryId}`);
    return res.data.data || [];
  },

  adminGetAll: async () => {
    const res = await api.get('/whiteboards/admin/all');
    return res.data.data || [];
  },

  adminDelete: async (id: string) => {
    const res = await api.delete(`/whiteboards/admin/${id}`);
    return res.data;
  },
};

export default whiteboardService;
