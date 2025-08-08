import { useState, useEffect } from 'react';

// Simple in-memory cache
const cache = new Map();
const CACHE_TIME = 0; // Disable caching for real-time updates

export const useApiWithCache = (apiCall, dependencies = [], cacheKey) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const key = cacheKey || JSON.stringify(dependencies);
      
      // Skip cache for real-time updates
      // Always fetch fresh data

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching fresh data for:', key);
        const result = await apiCall();
        
        // Cache the result
        cache.set(key, {
          data: result,
          timestamp: Date.now()
        });
        
        setData(result);
      } catch (err) {
        console.error('❌ API Error for', key, ':', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  // Optional: Add a method to clear cache for this key
  const clearCache = () => {
    const key = cacheKey || JSON.stringify(dependencies);
    cache.delete(key);
  };

  return { data, loading, error, clearCache };
};

// Utility function to clear all cache
export const clearAllCache = () => {
  cache.clear();
  console.log('🗑️ All cache cleared');
};
