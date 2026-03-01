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
};

export default categoryService;
