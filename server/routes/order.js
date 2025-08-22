import express from 'express';
import {
    createOrder,
    createManualPaymentOrder,
    verifyManualPayment,
    getUserOrders,
    getOrderById,
    cancelOrder,
    getOrderTracking,
    trackOrder,
    upload
} from '../controllers/order.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateUser, createOrder);
router.post('/create-manual-payment', authenticateUser, upload.single('screenshot'), createManualPaymentOrder);
router.put('/:orderId/verify-payment', authenticateAdmin, verifyManualPayment);
router.get('/', authenticateUser, getUserOrders);
router.get('/:orderId', authenticateUser, getOrderById);
router.put('/:orderId/cancel', authenticateUser, cancelOrder);
router.get('/:orderId/tracking', getOrderTracking);
router.post('/track', trackOrder);

export default router;
