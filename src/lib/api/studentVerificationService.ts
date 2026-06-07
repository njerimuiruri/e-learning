import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const api = axios.create({
  baseURL: `${API_URL}/api/student-verification`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const studentVerificationService = {
  uploadStudentId: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getMyStatus: async () => {
    const { data } = await api.get('/status');
    return data;
  },

  adminGetPending: async (page = 1, limit = 20) => {
    const { data } = await api.get('/admin/pending', { params: { page, limit } });
    return data;
  },

  adminGetAll: async (page = 1, limit = 20, status?: string) => {
    const { data } = await api.get('/admin/all', { params: { page, limit, status } });
    return data;
  },

  adminApprove: async (userId: string) => {
    const { data } = await api.post(`/admin/${userId}/approve`);
    return data;
  },

  adminReject: async (userId: string, reason: string) => {
    const { data } = await api.post(`/admin/${userId}/reject`, { reason });
    return data;
  },
};

export default studentVerificationService;
