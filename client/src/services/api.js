import axios from 'axios';

// Get API URL from environment variables with fallback
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 0,
  headers: {
    'Accept': 'application/json',
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get tokens from localStorage
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    
    // Determine which token to use based on the URL
    if (config.url?.includes('/admin/')) {
      // Use admin token for admin routes
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // Use regular user token for user routes
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Log request for debugging
    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`, {
      hasToken: !!(token || adminToken),
      isAdminRoute: config.url?.includes('/admin/')
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    
    // Handle token refresh
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      const isAdminRoute = response.config.url?.includes('/admin/');
      const storageKey = isAdminRoute ? 'adminToken' : 'token';
      localStorage.setItem(storageKey, newToken);
      console.log('🔄 Token refreshed automatically');
    }
    
    return response;
  },
  async (error) => {
    const { config, response } = error;
    
    console.error(`❌ ${config?.method?.toUpperCase()} ${config?.url}`, {
      status: response?.status,
      message: response?.data?.message || error.message,
      data: response?.data
    });
    
    // Handle rate limit without automatic logout
    if (response?.status === 429) {
      console.warn('Rate limit exceeded - please wait before retrying');
      return Promise.reject({
        ...error,
        message: response?.data?.message || 'Too many requests. Please wait before retrying.',
        rateLimited: true
      });
    }
    
    // Retry logic for network errors (not timeout errors)
    if (!response && config && !config.__retryCount && !error.code?.includes('TIMEOUT')) {
      config.__retryCount = 0;
    }
    
    if (!response && config && config.__retryCount < 2 && !error.code?.includes('TIMEOUT')) {
      config.__retryCount += 1;
      console.log(`🔄 Retrying request (${config.__retryCount}/2)...`);
      return new Promise(resolve => {
        setTimeout(() => resolve(api(config)), 1000 * config.__retryCount);
      });
    }
    
    // Handle different error scenarios
    if (response?.status === 401) {
      // Unauthorized - clear tokens and redirect
      if (config?.url?.includes('/admin/')) {
        // Admin route - clear admin token
        localStorage.removeItem('adminToken');
        if (!window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
      } else {
        // User route - clear user token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access forbidden:', response.data?.message);
    } else if (response?.status === 404) {
      // Not found
      console.error('Resource not found:', config?.url);
    } else if (response?.status >= 500) {
      // Server error
      console.error('Server error:', response.data?.message || 'Internal server error');
    } else if (!response) {
      // Network error
      console.error('Network error:', error.message);
    }
    
    // Return a more user-friendly error
    const errorMessage = response?.data?.message || 
                        response?.data?.error || 
                        error.message || 
                        'An unexpected error occurred';
    
    return Promise.reject({
      ...error,
      message: errorMessage,
      status: response?.status,
      data: response?.data
    });
  }
);

// Helper function to set auth token
export const setAuthToken = (token, isAdmin = false) => {
  if (token) {
    const storageKey = isAdmin ? 'adminToken' : 'token';
    localStorage.setItem(storageKey, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Helper function to clear auth
export const clearAuth = (isAdmin = false) => {
  const storageKey = isAdmin ? 'adminToken' : 'token';
  localStorage.removeItem(storageKey);
  
  if (!isAdmin) {
    localStorage.removeItem('user');
  }
  
  // Only clear the Authorization header if no tokens remain
  const hasUserToken = localStorage.getItem('token');
  const hasAdminToken = localStorage.getItem('adminToken');
  
  if (!hasUserToken && !hasAdminToken) {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initialize auth token on app start
const initializeAuth = () => {
  const token = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  
  // Set the most recent token as default
  if (adminToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
  } else if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Initialize auth when the module loads
initializeAuth();

export default api;
