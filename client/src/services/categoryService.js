import api from './api';

export const categoryService = {
  // Get all categories
  getCategories: async (cacheBuster = '') => {
    try {
      const response = await api.get(`/categories${cacheBuster}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch categories' };
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch category' };
    }
  },

  // Admin: Create category
  createCategory: async (categoryData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.post('/categories', categoryData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create category' };
    }
  },

  // Admin: Update category
  updateCategory: async (id, categoryData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.put(`/categories/${id}`, categoryData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update category' };
    }
  },

  // Admin: Delete category
  deleteCategory: async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.delete(`/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete category' };
    }
  }
};
