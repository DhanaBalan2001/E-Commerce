import api from './api';

export const productService = {
  // Get all products with filters
  getProducts: async (params = {}) => {
    try {
      console.log('Fetching products...');
      const response = await api.get('/products');
      console.log('Products received:', response.data);
      
      // Ensure consistent response format
      if (response.data.success) {
        return {
          products: response.data.products || [],
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || 1
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw { 
        message: error.response?.data?.message || 'Failed to load products',
        products: [],
        total: 0
      };
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    if (!id) throw new Error('Product ID is required');
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch product' };
    }
  },

  // Get featured products
  getFeaturedProducts: async () => {
    try {
      const response = await api.get('/products/featured');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch featured products' };
    }
  },

  // Get products by category
  getProductsByCategory: async (category, params = {}) => {
    try {
      const response = await api.get(`/products/category/${category}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch category products' };
    }
  },

  // Search products
  searchProducts: async (query, params = {}) => {
    try {
      const response = await api.get('/products/search', { 
        params: { q: query, ...params } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search products' };
    }
  },

  // Add product review
  addReview: async (productId, reviewData) => {
    try {
      const response = await api.post(`/products/${productId}/review`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add review' };
    }
  },

  // Admin: Create product
  createProduct: async (productData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.post('/products', productData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create product' };
    }
  },

  // Admin: Update product
   updateProduct: async (id, productData) => {
    if (!id) throw new Error('Product ID is required');
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.put(`/products/${id}`, productData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update product' };
    }
  },


  // Admin: Delete product
  deleteProduct: async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete product' };
    }
  },

  // Admin: Delete product image
  deleteProductImage: async (productId, imageId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.delete(`/products/${productId}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete image' };
    }
  }
};
