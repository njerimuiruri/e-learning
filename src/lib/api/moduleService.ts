import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

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
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.level) params.append('level', filters.level);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const response = await api.get(`/?${params.toString()}`);
      
      // Ensure consistent response structure
      if (!response.data) {
        console.warn('[moduleService] No data in response');
        return {
          modules: [],
          total: 0,
          pages: 0,
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('[moduleService] Failed to fetch all modules:', error.message);
      return {
        modules: [],
        total: 0,
        pages: 0,
      };
    }
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

  async deleteTopic(moduleId, topicIndex) {
    const response = await api.delete(`/${moduleId}/topics/${topicIndex}`);
    return response.data;
  },

  async addLesson(moduleId, topicIndex, lessonData) {
    const response = await api.post(`/${moduleId}/topics/${topicIndex}/lessons`, lessonData);
    return response.data;
  },

  async updateLesson(moduleId, topicIndex, lessonIndex, lessonData) {
    const response = await api.put(`/${moduleId}/topics/${topicIndex}/lessons/${lessonIndex}`, lessonData);
    return response.data;
  },

  async deleteLesson(moduleId, topicIndex, lessonIndex) {
    const response = await api.delete(`/${moduleId}/topics/${topicIndex}/lessons/${lessonIndex}`);
    return response.data;
  },

  // Direct lesson endpoints (Category → Module → Lesson, no topic layer)
  async addModuleLesson(moduleId, lessonData) {
    const response = await api.post(`/${moduleId}/lessons`, lessonData);
    return response.data;
  },

  async updateModuleLesson(moduleId, lessonIndex, lessonData) {
    const response = await api.put(`/${moduleId}/lessons/${lessonIndex}`, lessonData);
    return response.data;
  },

  async deleteModuleLesson(moduleId, lessonIndex) {
    const response = await api.delete(`/${moduleId}/lessons/${lessonIndex}`);
    return response.data;
  },

  async setFinalAssessment(moduleId, assessmentData) {
    const response = await api.post(`/${moduleId}/final-assessment`, assessmentData);
    return response.data;
  },

  async finalizeContent(moduleId) {
    const response = await api.put(`/${moduleId}/finalize`, {});
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

  async downloadModuleZip(moduleId: string, moduleTitle: string, onProgress?: (pct: number) => void): Promise<void> {
    const response = await api.get(`/${moduleId}/download`, {
      responseType: 'blob',
      onDownloadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduleTitle || 'module'}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  },
};

export default moduleService;
