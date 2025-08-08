import { useState, useEffect, useCallback } from 'react';
import { handleApiError } from '../utils/errorHandler';
import { handleLongRequest } from '../utils/apiConfig';

// Generic API hook
export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { immediate = true, onSuccess, onError } = options;

  const execute = useCallback(async (...args) => {
    // Check if apiFunction is actually a function
    if (typeof apiFunction !== 'function') {
      const errorMsg = 'API function is not defined or not a function';
      console.error(errorMsg, { apiFunction, args });
      setError({ message: errorMsg, type: 'FUNCTION_ERROR' });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use handleLongRequest for timeout-free execution
      const result = await handleLongRequest(
        () => apiFunction(...args),
        {
          maxRetries: 3,
          onProgress: (status) => console.log('Request status:', status)
        }
      );
      
      setData(result);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      console.error('API Error:', err);
      const errorInfo = handleApiError(err);
      setError(errorInfo);
      if (onError) onError(errorInfo);
      throw errorInfo;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  useEffect(() => {
    if (immediate && dependencies.every(dep => dep !== null && dep !== undefined)) {
      execute();
    }
  }, dependencies);

  return { data, loading, error, execute, refetch: execute };
};

// Mutation hook for POST, PUT, DELETE operations
export const useMutation = (apiFunction, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { onSuccess, onError } = options;

  const mutate = useCallback(async (...args) => {
    // Check if apiFunction is actually a function
    if (typeof apiFunction !== 'function') {
      const errorMsg = 'API function is not defined or not a function';
      console.error(errorMsg, { apiFunction, args });
      setError({ message: errorMsg, type: 'FUNCTION_ERROR' });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use handleLongRequest for timeout-free mutations
      const result = await handleLongRequest(
        () => apiFunction(...args),
        {
          maxRetries: 2, // Fewer retries for mutations
          onProgress: (status) => console.log('Mutation status:', status)
        }
      );
      
      setData(result);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      console.error('Mutation Error:', err);
      const errorInfo = handleApiError(err);
      setError(errorInfo);
      if (onError) onError(errorInfo);
      throw errorInfo;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, mutate, reset };
};
