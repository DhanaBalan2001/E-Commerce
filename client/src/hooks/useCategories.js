import { useState, useEffect } from 'react';
import { categoryService } from '../services';
import { useMutation } from './useApi';

export const useCategories = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      // Add cache busting for forced refresh
      const result = await categoryService.getCategories(force ? `?t=${Date.now()}` : '');
      setData(result);
    } catch (err) {
      console.error('Categories fetch error:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    
    // Listen for force refresh events
    const handleForceRefresh = () => fetchCategories(true);
    
    window.addEventListener('forceRefresh', handleForceRefresh);
    return () => window.removeEventListener('forceRefresh', handleForceRefresh);
  }, []);

  return { data, loading, error, refetch: () => fetchCategories(true) };
};

export const useCategory = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await categoryService.getCategoryById(id);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchCategory();
  }, [id]);

  return { data, loading, error };
};

// Admin category hooks (keep mutations as they are - no caching needed)
export const useCreateCategory = (onSuccess) => {
  const mutation = useMutation(
    categoryService.createCategory, 
    { 
      onSuccess: (data) => {
        // Force immediate refresh
        if (typeof window !== 'undefined') {
          localStorage.setItem('categoryListNeedsRefresh', 'true');
          window.dispatchEvent(new CustomEvent('categoryCreated', { detail: data }));
          window.dispatchEvent(new CustomEvent('forceRefresh'));
        }
        if (onSuccess) onSuccess(data);
      }
    }
  );
  
  return {
    ...mutation,
    mutateAsync: async (variables) => {
      try {
        const result = await mutation.mutateAsync(variables);
        return result;
      } catch (error) {
        throw error;
      }
    }
  };
};

export const useUpdateCategory = (onSuccess) => {
  const mutation = useMutation(
    ({ id, data }) => categoryService.updateCategory(id, data), 
    { 
      onSuccess: (data) => {
        // Force immediate refresh
        if (typeof window !== 'undefined') {
          localStorage.setItem('categoryListNeedsRefresh', 'true');
          // Dispatch multiple events to ensure refresh
          window.dispatchEvent(new CustomEvent('categoryUpdated', { detail: data }));
          window.dispatchEvent(new CustomEvent('forceRefresh'));
        }
        if (onSuccess) onSuccess(data);
      }
    }
  );
  
  return {
    ...mutation,
    mutateAsync: async (variables) => {
      try {
        const result = await mutation.mutateAsync(variables);
        return result;
      } catch (error) {
        throw error;
      }
    }
  };
};

export const useDeleteCategory = (onSuccess) => {
  const mutation = useMutation(categoryService.deleteCategory, { 
    onSuccess: (data) => {
      // Force immediate refresh
      if (typeof window !== 'undefined') {
        localStorage.setItem('categoryListNeedsRefresh', 'true');
        window.dispatchEvent(new CustomEvent('categoryDeleted', { detail: data }));
        window.dispatchEvent(new CustomEvent('forceRefresh'));
      }
      if (onSuccess) onSuccess(data);
    }
  });
  
  return {
    ...mutation,
    mutateAsync: async (variables) => {
      try {
        const result = await mutation.mutateAsync(variables);
        return result;
      } catch (error) {
        throw error;
      }
    }
  };
};
