import express from 'express';
import {
    createOrder,
    verifyPayment,
    getUserOrders,
    getOrderById,
    cancelOrder,
    getOrderTracking,
    trackOrder
} from '../controllers/order.js';
import { authenticateUser, authenticateAdmin, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// User order routes
router.post('/', authenticateUser, createOrder);
router.post('/verify-payment', authenticateUser, verifyPayment);
router.get('/', authenticateUser, getUserOrders);
router.get('/:orderId', authenticateUser, getOrderById);
router.put('/:orderId/cancel', authenticateUser, cancelOrder);
router.get('/:orderId/tracking', getOrderTracking);
router.post('/track', trackOrder);



export default router;
