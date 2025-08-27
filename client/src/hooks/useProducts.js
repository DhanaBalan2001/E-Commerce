import { useState, useCallback, useEffect, useMemo } from 'react';
import { productService } from '../services';
import { useApiWithCache } from './useApiWithCache';
import { useMutation } from './useApi';

export const useProducts = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  const fetchProducts = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add cache busting for forced refresh
      const filtersWithCache = force ? { ...memoizedFilters, _t: Date.now() } : memoizedFilters;
      const result = await productService.getProducts(filtersWithCache);
      
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load products');
      setData({ products: [], total: 0, totalPages: 1, currentPage: 1 });
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters, refreshTrigger]);

  // Listen for cache invalidation events
  useEffect(() => {
    const handleCacheInvalidation = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('forceProductsRefresh', handleCacheInvalidation);
    window.addEventListener('forceAllRefresh', handleCacheInvalidation);

    return () => {
      window.removeEventListener('forceProductsRefresh', handleCacheInvalidation);
      window.removeEventListener('forceAllRefresh', handleCacheInvalidation);
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, memoizedFilters.search ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [fetchProducts, memoizedFilters.search]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchProducts(true)
  };
};

export const useProduct = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await productService.getProductById(id);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchProduct();
  }, [id]);

  return { data, loading, error };
};

export const useFeaturedProducts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await productService.getFeaturedProducts();
        setData(result);
      } catch (err) {
        setError(err.message);
        setData({ products: [] }); // Fallback
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeatured();
  }, []);

  return { data, loading, error };
};

export const useProductsByCategory = (category, params = {}) => {
  return useApiWithCache(
    () => productService.getProductsByCategory(category, params),
    [category, JSON.stringify(params)],
    `products-category-${category}-${JSON.stringify(params)}`
  );
};

export const useProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useState({});
  
  const searchResult = useApiWithCache(
    () => productService.searchProducts(searchQuery, searchParams),
    [searchQuery, JSON.stringify(searchParams)],
    `search-${searchQuery}-${JSON.stringify(searchParams)}`
  );

  const search = useCallback((query, params = {}) => {
    setSearchQuery(query);
    setSearchParams(params);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchParams({});
  }, []);

  // Auto-execute search when query changes (with debounce effect)
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        // Debounced search execution
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchParams]);

  return {
    ...searchResult,
    search,
    searchQuery,
    searchParams,
    clearSearch,
    isSearching: searchResult.loading && !!searchQuery
  };
};

// Keep mutation hooks as they are (no caching needed for mutations)
export const useProductReview = () => {
  return useMutation(productService.addReview);
};

export const useCreateProduct = () => {
  return useMutation(productService.createProduct, {
    onSuccess: (data) => {
      // Dispatch events for product creation
      window.dispatchEvent(new CustomEvent('productCreated', { detail: data }));
      
      // If it's a featured product, update home page
      if (data?.product?.isFeatured) {
        window.dispatchEvent(new CustomEvent('featuredProductsUpdate'));
      }
    }
  });
};

export const useUpdateProduct = () => {
  return useMutation(productService.updateProduct, {
    onSuccess: (data) => {
      // Dispatch events for product update
      window.dispatchEvent(new CustomEvent('productUpdated', { detail: data }));
      
      // If it's a featured product, update home page
      if (data?.product?.isFeatured) {
        window.dispatchEvent(new CustomEvent('featuredProductsUpdate'));
      }
    }
  });
};

export const useDeleteProduct = () => {
  const mutation = useMutation(productService.deleteProduct, {
    onSuccess: (data) => {
      // Dispatch events for product deletion
      window.dispatchEvent(new CustomEvent('productDeleted', { detail: data }));
      window.dispatchEvent(new CustomEvent('featuredProductsUpdate'));
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

export const useDeleteProductImage = () => {
  return useMutation(productService.deleteProductImage);
};

// Bulk operations hook (no caching needed)
export const useProductBulkOperations = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);

  const selectProduct = useCallback((productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const selectAllProducts = useCallback((productIds) => {
    setSelectedProducts(productIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  return {
    selectedProducts,
    selectProduct,
    selectAllProducts,
    clearSelection,
    hasSelection: selectedProducts.length > 0,
    selectionCount: selectedProducts.length
  };
};
