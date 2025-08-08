import api from './api';

export const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create order' };
    }
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post('/orders/verify-payment', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify payment' };
    }
  },

  // Get user orders
  getUserOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

   // Get all orders for the current user
  getOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch order' };
    }
  },

  // Cancel order
  cancelOrder: async (orderId, reason) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel order' };
    }
  },

  // Admin: Get all orders
  getAllOrders: async (params = {}) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.get('/orders/admin/all', { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

  // Admin: Update order status
  updateOrderStatus: async (orderId, statusData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.put(`/orders/admin/${orderId}/status`, statusData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update order status' };
    }
  },

  // Track order by order number and email
  trackOrder: async (orderNumber, email) => {
    try {
      const response = await api.post('/orders/track', { orderNumber, email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to track order' };
    }
  }
};


