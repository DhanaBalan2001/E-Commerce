import express from 'express';
import {
  getBundles,
  getBundleById,
  createBundle,
  updateBundle,
  deleteBundle
} from '../controllers/bundleController.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getBundles);
router.get('/:id', getBundleById);

// Admin routes
router.post('/', authenticateAdmin, createBundle);
router.put('/:id', authenticateAdmin, updateBundle);
router.delete('/:id', authenticateAdmin, deleteBundle);

export default router;