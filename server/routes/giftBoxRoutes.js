import express from 'express';
import {
  getGiftBoxes,
  getGiftBoxById,
  createGiftBox,
  updateGiftBox,
  deleteGiftBox
} from '../controllers/giftBoxController.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getGiftBoxes);
router.get('/:id', getGiftBoxById);

// Admin routes
router.post('/', authenticateAdmin, createGiftBox);
router.put('/:id', authenticateAdmin, updateGiftBox);
router.delete('/:id', authenticateAdmin, deleteGiftBox);

export default router;