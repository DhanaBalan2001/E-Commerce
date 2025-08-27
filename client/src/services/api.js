import axios from 'axios';


// Get API URL from environment variables with fallback
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Accept': 'application/json',
  }
});

// Request interceptor to add auth token and performance monitoring
api.interceptors.request.use(
  (config) => {
    // Start performance monitoring
    config.metadata = { startTime: performance.now() };
    
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
    

    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and performance monitoring
api.interceptors.response.use(
  (response) => {

    
    // Handle token refresh
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      const isAdminRoute = response.config.url?.includes('/admin/');
      const storageKey = isAdminRoute ? 'adminToken' : 'token';
      localStorage.setItem(storageKey, newToken);
    }
    
    return response;
  },
  async (error) => {
    const { config, response } = error;
    

    
    // Handle rate limit without automatic logout
    if (response?.status === 429) {
      return Promise.reject({
        ...error,
        message: response?.data?.message || 'Too many requests. Please wait before retrying.',
        rateLimited: true
      });
    }
    
    // Enhanced retry logic for network errors and timeouts
    if (!response && config && !config.__retryCount) {
      config.__retryCount = 0;
    }
    
    // Retry for network errors (including timeouts) but with different strategies
    if (!response && config && config.__retryCount < 2) {
      config.__retryCount += 1;
      
      // Increase timeout for retries
      config.timeout = Math.min(config.timeout * 1.5, 180000); // Max 3 minutes
      
      const retryDelay = config.__retryCount * 3000; // Progressive delay
      console.log(`🔄 Retrying request (${config.__retryCount}/2) after ${retryDelay}ms: ${config.url}`);
      
      return new Promise(resolve => {
        setTimeout(() => resolve(api(config)), retryDelay);
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

    } else if (response?.status === 404) {
      // Not found

    } else if (response?.status >= 500) {
      // Server error

    } else if (!response) {
      // Network error

    }
    
    // Return a more user-friendly error with network context
    let errorMessage = response?.data?.message || 
                      response?.data?.error || 
                      error.message || 
                      'An unexpected error occurred';
    
    // Add context for network issues
    if (!response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
    }
    
    return Promise.reject({
      ...error,
      message: errorMessage,
      status: response?.status,
      data: response?.data,
      isNetworkError: !response,
      isTimeout: error.code === 'ECONNABORTED' || error.message?.includes('timeout')
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