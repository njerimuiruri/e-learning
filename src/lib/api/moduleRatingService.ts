import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/module-ratings`,
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

const moduleRatingService = {
  // Student: submit or update rating (1-5 stars + optional review)
  async submitRating(moduleId: string, rating: number, review?: string) {
    const response = await api.post(`/${moduleId}`, { rating, review });
    return response.data;
  },

  // Student: get own rating for a module
  async getMyRating(moduleId: string) {
    const response = await api.get(`/my/${moduleId}`);
    return response.data;
  },

  // Public: get summary stats (avgRating, totalRatings, distribution)
  async getModuleSummary(moduleId: string) {
    const response = await api.get(`/${moduleId}/summary`);
    return response.data;
  },

  // Instructor / Admin: get paginated reviews for a module
  async getModuleReviews(moduleId: string, page = 1, limit = 20) {
    const response = await api.get(`/${moduleId}/reviews`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Instructor: rating analytics for own modules
  async getInstructorAnalytics() {
    const response = await api.get('/instructor/analytics');
    return response.data;
  },

  // Admin / Super-admin: rating analytics for all published modules
  async getAdminAnalytics(params: {
    page?: number;
    limit?: number;
    sortBy?: 'avgRating' | 'totalRatings' | 'title';
  } = {}) {
    const response = await api.get('/admin/analytics', { params });
    return response.data;
  },
};

export default moduleRatingService;
