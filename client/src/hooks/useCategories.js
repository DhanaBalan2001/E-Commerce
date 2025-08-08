import { useState, useEffect } from 'react';
import { categoryService } from '../services';
import { useMutation } from './useApi';

export const useCategories = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await categoryService.getCategories();
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
  }, []);

  return { data, loading, error, refetch: fetchCategories };
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
  return useMutation(categoryService.createCategory, { onSuccess });
};

export const useUpdateCategory = (onSuccess) => {
  return useMutation(({ id, data }) => categoryService.updateCategory(id, data), { onSuccess });
};

export const useDeleteCategory = (onSuccess) => {
  return useMutation(categoryService.deleteCategory, { onSuccess });
};
