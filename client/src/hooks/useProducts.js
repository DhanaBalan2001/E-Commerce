import { useState, useCallback, useEffect } from 'react';
import { productService } from '../services';
import { useApiWithCache } from './useApiWithCache';
import { useMutation } from './useApi';

export const useProducts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching products...');
      
      const result = await productService.getProducts();
      console.log('Products loaded:', result);
      
      setData(result);
    } catch (err) {
      console.error('Products error:', err);
      setError(err.message || 'Failed to load products');
      // Set fallback data
      setData({ products: [], total: 0, totalPages: 1, currentPage: 1 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    data,
    loading,
    error,
    refetch: fetchProducts
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
        console.error('Featured products error:', err);
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
        // For search, we might want to trigger a re-fetch
        // You can add a refetch method to your useApiWithCache if needed
      }, 500); // 500ms debounce

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
  return useMutation(productService.createProduct);
};

export const useUpdateProduct = () => {
  return useMutation(productService.updateProduct);
};

export const useDeleteProduct = () => {
  return useMutation(productService.deleteProduct);
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
