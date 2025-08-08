import api from './api';

export const reviewService = {
  // Add product review
  addReview: async (productId, reviewData) => {
    try {
      const response = await api.post(`/products/${productId}/review`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Review addition error:', error);
      throw error.response?.data || { message: 'Failed to add review' };
    }
  },

  // Get product reviews
  getReviews: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Review fetch error:', error);
      throw error.response?.data || { message: 'Failed to fetch product reviews' };
    }
  },

  getAllReviews: async () => {
    try {
      const response = await api.get('/reviews/recent'); // Adjust endpoint if needed
      return response.data.reviews;
    } catch (error) {
      console.error('Review fetch error:', error);
      throw error.response?.data || { message: 'Failed to fetch reviews' };
    }
  }
};

