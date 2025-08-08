import express from 'express';
import {
    getUserAddresses,
    addAddress,
    updateAddress,
    deleteAddress
} from '../controllers/address.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, getUserAddresses);
router.post('/', authenticateUser, addAddress);
router.put('/:addressId', authenticateUser, updateAddress);
router.delete('/:addressId', authenticateUser, deleteAddress);

export default router;
