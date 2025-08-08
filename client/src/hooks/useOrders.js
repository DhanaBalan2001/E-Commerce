import { useState, useCallback } from 'react';
import { useApi, useMutation } from './useApi';
import { orderService } from '../services';
import { useToast } from '../context/ToastContext';
import { handleApiError } from '../utils/errorHandler.jsx';

export const useOrders = (initialFilters = {}) => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    search: '',
    ...initialFilters
  });

  const toast = useToast();

  const ordersQuery = useApi(
    () => orderService.getUserOrders(filters),
    [filters],
    { immediate: true }
  );

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10,
      status: '',
      search: ''
    });
  }, []);

  return {
    ...ordersQuery,
    filters,
    updateFilters,
    clearFilters
  };
};

export const useOrder = (orderId) => {
  return useApi(
    () => orderService.getOrderById(orderId),
    [orderId],
    { immediate: !!orderId }
  );
};

export const useOrderMutations = () => {
  const toast = useToast();

  const cancelOrder = useMutation(
    ({ orderId, reason }) => orderService.cancelOrder(orderId, reason),
    {
      onSuccess: () => {
        toast.success('Order cancelled successfully');
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(errorInfo.message);
      }
    }
  );

  const createOrder = useMutation(orderService.createOrder, {
    onSuccess: () => {
      toast.success('Order placed successfully');
    },
    onError: (error) => {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    }
  });

  const verifyPayment = useMutation(orderService.verifyPayment, {
    onSuccess: () => {
      toast.success('Payment verified successfully');
    },
    onError: (error) => {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    }
  });

  return {
    cancelOrder,
    createOrder,
    verifyPayment
  };
};
