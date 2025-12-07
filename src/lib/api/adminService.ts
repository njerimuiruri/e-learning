import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: `${API_URL}/admin`,
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

const adminService = {
  // Users
  getAllUsers: async (filters: { role?: string | null; status?: string | null; page?: number; limit?: number } = {}) => {
    const { data } = await api.get('/users', { params: filters });
    return data;
  },
  getUserById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
  activateUser: async (id: string) => {
    const { data } = await api.put(`/users/${id}/activate`);
    return data;
  },
  deactivateUser: async (id: string) => {
    const { data } = await api.put(`/users/${id}/deactivate`);
    return data;
  },
  deleteUser: async (id: string) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const { data } = await api.get('/stats');
    return data;
  },
  getPendingInstructors: async () => {
    const { data } = await api.get('/instructors/pending');
    return data;
  },
  getFellowsAtRisk: async () => {
    const { data } = await api.get('/fellows/at-risk');
    return data;
  },
  getRecentActivity: async (limit = 5, type?: string) => {
    const { data } = await api.get('/activity', { params: { limit, type } });
    return data;
  },

  // Instructors
  getAllInstructors: async (filters: { status?: string | null; page?: number; limit?: number } = {}) => {
    const { data } = await api.get('/instructors', { params: filters });
    return data;
  },
  getInstructorDetails: async (id: string) => {
    const { data } = await api.get(`/instructors/${id}`);
    return data;
  },
  approveInstructor: async (id: string) => {
    const { data } = await api.put(`/instructors/${id}/approve`);
    return data;
  },
  rejectInstructor: async (id: string, reason: string) => {
    const { data } = await api.put(`/instructors/${id}/reject`, { reason });
    return data;
  },

  // Students
  getAllStudents: async (filters: { page?: number; limit?: number; search?: string } = {}) => {
    const { data } = await api.get('/students', { params: filters });
    return data;
  },
  getStudentById: async (id: string) => {
    const { data } = await api.get(`/students/${id}`);
    return data;
  },
  createStudent: async (payload: any) => {
    const { data } = await api.post('/students', payload);
    return data;
  },
  deleteStudent: async (id: string) => {
    const { data } = await api.delete(`/students/${id}`);
    return data;
  },

  // Fellows
  sendFellowReminder: async (id: string, message: string) => {
    const { data } = await api.post(`/fellows/${id}/send-reminder`, { message });
    return data;
  },
};

export default adminService;
