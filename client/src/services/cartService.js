import api from './api';

export const cartService = {
  // Get cart items
getCart: async () => {
  try {
    const response = await api.get('/cart');
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Not logged in – return empty cart
      return { cart: [], cartTotal: 0, itemCount: 0 };
    }
    throw error.response?.data || { message: 'Failed to fetch cart' };
  }
},

  // Add item to cart
  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await api.post('/cart/add', { productId, quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add to cart' };
    }
  },

  // Update cart item quantity
  updateCartItem: async (productId, quantity) => {
    try {
      const response = await api.put('/cart/update', { productId, quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update cart' };
    }
  },

  // Remove item from cart
  removeFromCart: async (productId) => {
    try {
      const response = await api.delete(`/cart/remove/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove from cart' };
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const response = await api.delete('/cart/clear');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to clear cart' };
    }
  }
};


