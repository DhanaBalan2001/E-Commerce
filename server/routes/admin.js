import express from 'express';
import {
    adminLogin,
    createFirstAdmin,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    adminForgotPassword,
    adminResetPassword
} from '../controllers/auth.js';
import {
    getDashboardStats,
    getUsers,
    createAdmin,
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    getAdminStats,
    getUserStats,
    getOrders,
    updateUserStatus,
    exportOrdersCSV
 } from '../controllers/admin.js';
import {
    getAllOrders,
    getAdminOrderById,
    updateOrderStatus,
    exportOrders,
    verifyManualPayment
} from '../controllers/order.js';
    

import { authenticateAdmin, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Admin authentication routes
router.post('/login', adminLogin);
router.post('/logout', authenticateAdmin, (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});
router.post('/create-first', createFirstAdmin);
router.post('/forgot-password', adminForgotPassword);
router.post('/reset-password', adminResetPassword);
router.get('/profile', authenticateAdmin, getAdminProfile);
router.put('/profile', authenticateAdmin, updateAdminProfile);
router.put('/change-password', authenticateAdmin, changeAdminPassword);

// Dashboard
router.get('/dashboard', authenticateAdmin, getDashboardStats);

// Orders management
router.get('/orders', authenticateAdmin, getAllOrders);
router.get('/orders/export', authenticateAdmin, exportOrders);
router.get('/orders/:id', authenticateAdmin, getAdminOrderById);
router.put('/orders/:id/status', authenticateAdmin, updateOrderStatus);
router.put('/orders/:orderId/verify-payment', authenticateAdmin, verifyManualPayment);

// User management
router.get('/users', authenticateAdmin, checkPermission('manage_users'), getUsers);
router.get('/users/stats', authenticateAdmin, getUserStats);
router.put('/users/:id/status', authenticateAdmin, checkPermission('manage_users'), updateUserStatus);

// Admin management
router.get('/admins', authenticateAdmin, checkPermission('manage_admins'), getAllAdmins);
router.get('/admins/details', authenticateAdmin, getAllAdmins);
router.get('/admins/stats', authenticateAdmin, checkPermission('manage_admins'), getAdminStats);
router.get('/admins/:id', authenticateAdmin, checkPermission('manage_admins'), getAdminById);
router.post('/admins', authenticateAdmin, checkPermission('manage_admins'), createAdmin);
router.put('/admins/:id', authenticateAdmin, checkPermission('manage_admins'), updateAdmin);
router.delete('/admins/:id', authenticateAdmin, checkPermission('manage_admins'), deleteAdmin);

export default router;
