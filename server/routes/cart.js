import express from 'express';
import {
    getCart,
    addToCart,
    addBundleToCart,
    addGiftBoxToCart,
    updateCartItem,
    updateBundleQuantity,
    updateGiftBoxQuantity,
    removeFromCart,
    removeBundleFromCart,
    removeGiftBoxFromCart,
    clearCart
} from '../controllers/cart.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, getCart);
router.post('/add', authenticateUser, addToCart);
router.post('/add-bundle', authenticateUser, addBundleToCart);
router.post('/add-giftbox', authenticateUser, addGiftBoxToCart);
router.put('/update', authenticateUser, updateCartItem);
router.put('/update-bundle', authenticateUser, updateBundleQuantity);
router.put('/update-giftbox', authenticateUser, updateGiftBoxQuantity);
router.delete('/remove/:productId', authenticateUser, removeFromCart);
router.delete('/remove-bundle/:bundleId', authenticateUser, removeBundleFromCart);
router.delete('/remove-giftbox/:giftBoxId', authenticateUser, removeGiftBoxFromCart);
router.delete('/clear', authenticateUser, clearCart);

export default router;
