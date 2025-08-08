// API Configuration utilities
export const API_CONFIG = {
  // No timeout restrictions
  timeout: 0,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
  
  // Request headers
  defaultHeaders: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

// Helper function to create request with no timeout
export const createRequest = (config = {}) => {
  return {
    ...config,
    timeout: 0,
    headers: {
      ...API_CONFIG.defaultHeaders,
      ...config.headers
    }
  };
};

// Helper function for handling long-running requests
export const handleLongRequest = async (requestFn, options = {}) => {
  const { onProgress, maxRetries = 3 } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (onProgress) {
        onProgress(`Attempt ${attempt}/${maxRetries}`);
      }
      
      const result = await requestFn();
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};