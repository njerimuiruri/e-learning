import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const categoryService = {
  // Get all active categories
  getAllCategories: async () => {
    try {
      const response = await api.get('/categories');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch category:', error);
      return null;
    }
  },

  // Create new category (admin only)
  createCategory: async (categoryData) => {
    try {
      const response = await api.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  },

  // Update category (admin only)
  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },

  // Delete category (admin only)
  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  },

  // Get all published modules for a specific category
  getModulesByCategory: async (categoryId, filters: { level?: string; search?: string; page?: number; limit?: number } = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const response = await api.get(
        `/categories/${categoryId}/modules?${params.toString()}`
      );
      
      // Backend returns: { success: true, data: [...], total, pages, page, limit }
      if (response.data?.success === false || !response.data?.data) {
        console.warn('[categoryService] Empty or failed response from API:', response.data);
        return {
          success: true,
          data: [],
          total: 0,
          pages: 0,
          page: filters.page || 1,
          limit: filters.limit || 12,
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('[categoryService] Failed to fetch modules for category:', { categoryId, error: error.message });
      return {
        success: true,
        data: [],
        total: 0,
        pages: 0,
        page: filters.page || 1,
        limit: filters.limit || 12,
      };
    }
  },

  // Get category details with all its modules in one request
  getCategoryWithModules: async (categoryId, filters: { level?: string; search?: string; page?: number; limit?: number } = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const response = await api.get(
        `/categories/${categoryId}/with-modules?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch category with modules:', error);
      return {
        success: false,
        category: null,
        modules: [],
        total: 0,
        pages: 0,
      };
    }
  },
};

export default categoryService;
