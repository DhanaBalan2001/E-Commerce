import express from 'express';
import {
    sendOTPController,
    verifyOTPController,
    getUserProfile,
    updateUserProfile
} from '../controllers/auth.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';
import { validateEmail, validateOTP } from '../middleware/validation.js';

const router = express.Router();

// User authentication routes (Email-based)
router.post('/send-otp', sendOTPController);
router.post('/verify-otp', validateOTP, verifyOTPController);
router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);


export default router;
