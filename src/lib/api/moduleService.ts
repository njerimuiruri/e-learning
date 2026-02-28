import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/modules`,
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

const moduleService = {
  async createModule(moduleData) {
    const response = await api.post('/', moduleData);
    return response.data;
  },

  async getAllModules(filters: { category?: string; level?: string; search?: string; page?: number; limit?: number } = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.level) params.append('level', filters.level);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/?${params.toString()}`);
    return response.data;
  },

  async getInstructorModules() {
    const response = await api.get('/instructor/my-modules');
    return response.data;
  },

  async getInstructorStats() {
    const response = await api.get('/instructor/stats');
    return response.data;
  },

  async getModulesByLevelAndCategory(categoryId, level) {
    const response = await api.get(`/category/${categoryId}/level/${level}`);
    return response.data;
  },

  async getModuleById(moduleId) {
    const response = await api.get(`/${moduleId}`);
    return response.data;
  },

  async updateModule(moduleId, updateData) {
    const response = await api.put(`/${moduleId}`, updateData);
    return response.data;
  },

  async addLesson(moduleId, lessonData) {
    const response = await api.post(`/${moduleId}/lessons`, lessonData);
    return response.data;
  },

  async updateLesson(moduleId, lessonIndex, lessonData) {
    const response = await api.put(`/${moduleId}/lessons/${lessonIndex}`, lessonData);
    return response.data;
  },

  async deleteLesson(moduleId, lessonIndex) {
    const response = await api.delete(`/${moduleId}/lessons/${lessonIndex}`);
    return response.data;
  },

  async setFinalAssessment(moduleId, assessmentData) {
    const response = await api.post(`/${moduleId}/final-assessment`, assessmentData);
    return response.data;
  },

  async submitForApproval(moduleId) {
    const response = await api.post(`/${moduleId}/submit`, {});
    return response.data;
  },

  async approveModule(moduleId) {
    const response = await api.post(`/${moduleId}/approve`, {});
    return response.data;
  },

  async publishModule(moduleId) {
    const response = await api.post(`/${moduleId}/publish`, {});
    return response.data;
  },

  async rejectModule(moduleId, rejectionReason) {
    const response = await api.post(`/${moduleId}/reject`, { rejectionReason });
    return response.data;
  },

  async deleteModule(moduleId) {
    const response = await api.delete(`/${moduleId}`);
    return response.data;
  },
};

export default moduleService;
