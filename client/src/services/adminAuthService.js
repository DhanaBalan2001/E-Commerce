import api from './api';

export const adminAuthService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/admin/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
        
        // Set default authorization header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  logout: async () => {
    try {
      await api.post('/admin/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  getCurrentAdmin: async () => {
    try {
      const response = await api.get('/admin/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get admin profile' };
    }
  },

  getStoredAdmin: () => {
    try {
      const adminUser = localStorage.getItem('adminUser');
      return adminUser ? JSON.parse(adminUser) : null;
    } catch (error) {
      return null;
    }
  },

  getStoredToken: () => {
    return localStorage.getItem('adminToken');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminUser');
    return !!(token && admin);
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/admin/refresh');
      
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Token refresh failed' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/admin/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send reset email' };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/admin/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reset password' };
    }
  }
};
