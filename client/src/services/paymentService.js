import api from './api';

export const paymentService = {
    createOrder: async (orderData) => {
        const response = await api.post('/payment/create-order', orderData);
        return response.data;
    },

    verifyPayment: async (paymentData) => {
        const response = await api.post('/payment/verify', paymentData);
        return response.data;
    },

    handleFailure: async (failureData) => {
        const response = await api.post('/payment/failure', failureData);
        return response.data;
    }
};

export default paymentService;