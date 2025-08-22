import api from './api';

export const authService = {
  // Send OTP to email
  sendOTP: async (email) => {
    try {
      const response = await api.post('/auth/send-otp', { email });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to send OTP' };
      throw errorData;
    }
  },

  // Verify OTP and login
  verifyOTP: async (email, otp, name = '') => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp, name });
      
      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to verify OTP' };
      throw errorData;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get profile' };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      // Update stored user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Get current user profile (alias for getProfile)
  getUserProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get profile' };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const isAuth = !!(token && user);

    return isAuth;
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Set auth token
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Clear auth data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Admin Authentication Services
export const adminAuthService = {
  // Create first admin
  createFirstAdmin: async (adminData) => {
    try {
      const response = await api.post('/auth/admin/create-first', adminData);
      
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('admin', JSON.stringify(response.data.admin));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create admin' };
    }
  },

  // Admin login
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/admin/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('admin', JSON.stringify(response.data.admin));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to login' };
    }
  },

  // Get admin profile
  getProfile: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.get('/auth/admin/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get admin profile' };
    }
  },

  // Update admin profile
  updateProfile: async (profileData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.put('/auth/admin/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.admin) {
        localStorage.setItem('admin', JSON.stringify(response.data.admin));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change admin password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.put('/auth/admin/change-password', 
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Admin logout
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    window.location.href = '/admin/login';
  },

  // Check if admin is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('adminToken');
  },

  // Get current admin
  getCurrentAdmin: () => {
    const admin = localStorage.getItem('admin');
    return admin ? JSON.parse(admin) : null;
  },

  // Get admin token
  getToken: () => {
    return localStorage.getItem('adminToken');
  },

  // Set admin token
  setToken: (token) => {
    localStorage.setItem('adminToken', token);
  },

  // Clear admin auth data
  clearAuth: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
  }
};


