import api from './api';

export const addressService = {
  // Get user addresses
  getAddresses: async () => {
    try {
      const response = await api.get('/addresses');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch addresses' };
    }
  },

  // Add new address
  addAddress: async (addressData) => {
    try {
      const response = await api.post('/addresses', addressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add address' };
    }
  },

  // Update address
  updateAddress: async (addressId, addressData) => {
    try {
      const response = await api.put(`/addresses/${addressId}`, addressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update address' };
    }
  },

  // Delete address
  deleteAddress: async (addressId) => {
    try {
      const response = await api.delete(`/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete address' };
    }
  }
};
