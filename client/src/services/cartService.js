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

  // Add bundle to cart
  addBundleToCart: async (bundleId, quantity = 1) => {
    try {
      const response = await api.post('/cart/add-bundle', { bundleId, quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add bundle to cart' };
    }
  },

  // Add gift box to cart
  addGiftBoxToCart: async (giftBoxId, quantity = 1) => {
    try {
      const response = await api.post('/cart/add-giftbox', { giftBoxId, quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add gift box to cart' };
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
  },

  // Remove bundle from cart
  removeBundleFromCart: async (bundleId) => {
    try {
      const response = await api.delete(`/cart/remove-bundle/${bundleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove bundle from cart' };
    }
  },

  // Remove gift box from cart
  removeGiftBoxFromCart: async (giftBoxId) => {
    try {
      const response = await api.delete(`/cart/remove-giftbox/${giftBoxId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove gift box from cart' };
    }
  },

  // Update bundle quantity
  updateBundleQuantity: async (bundleId, quantity) => {
    try {
      const response = await api.put('/cart/update-bundle', { bundleId, quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update bundle quantity' };
    }
  },

  // Update gift box quantity
  updateGiftBoxQuantity: async (giftBoxId, quantity) => {
    try {
      const response = await api.put('/cart/update-giftbox', { giftBoxId, quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update gift box quantity' };
    }
  }
};


