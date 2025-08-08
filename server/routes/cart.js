import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} from '../controllers/cart.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, getCart);
router.post('/add', authenticateUser, addToCart);
router.put('/update', authenticateUser, updateCartItem);
router.delete('/remove/:productId', authenticateUser, removeFromCart);
router.delete('/clear', authenticateUser, clearCart);

export default router;
