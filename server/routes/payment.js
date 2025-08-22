import express from 'express';

const router = express.Router();

// Payment routes are now handled through order routes
// All Razorpay functionality has been removed
// Manual payment processing is handled in /api/orders/create-manual-payment

export default router;