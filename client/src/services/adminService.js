import api from './api';

export const adminService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard stats' };
    }
  },

  // Get all users
  getUsers: async (params = {}) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.get('/admin/users', { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Get all admins
  getAdmins: async (params = {}) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.get('/admin/admins', { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch admins' };
    }
  },

  // Get admin stats
  getAdminStats: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.get('/admin/admins/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch admin stats' };
    }
  },

  // Get admin by ID
  getAdminById: async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.get(`/admin/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch admin' };
    }
  },

  // Create new admin
  createAdmin: async (adminData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.post('/admin/admins', adminData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create admin' };
    }
  },

  // Update admin
  updateAdmin: async (id, adminData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.put(`/admin/admins/${id}`, adminData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update admin' };
    }
  },

  // Delete admin
  deleteAdmin: async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.delete(`/admin/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete admin' };
    }
  }
};
