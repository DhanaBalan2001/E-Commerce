import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { addressService } from '../services';
import { useToast } from '../context/ToastContext';

export const useAddresses = () => {
  const toast = useToast();
  
  const {
    data: addressesData,
    loading,
    error,
    refetch
  } = useApi(addressService.getUserAddresses, [], { immediate: true });

  const addresses = addressesData?.addresses || [];

  return {
    addresses,
    loading,
    error,
    refetch
  };
};

export const useAddressMutations = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addAddress = useCallback(async (addressData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await addressService.addAddress(addressData);
      toast.success('Address added successfully!');
      return result;
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to add address');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateAddress = useCallback(async (addressId, addressData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await addressService.updateAddress(addressId, addressData);
      toast.success('Address updated successfully!');
      return result;
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to update address');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteAddress = useCallback(async (addressId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await addressService.deleteAddress(addressId);
      toast.success('Address deleted successfully!');
      return result;
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to delete address');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    addAddress,
    updateAddress,
    deleteAddress,
    loading,
    error
  };
};
