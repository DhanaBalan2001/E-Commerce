import express from 'express';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/category.js';
import { authenticateAdmin, checkPermission } from '../middleware/auth.js';
import { upload, handleMulterError } from '../middleware/upload.js'; 

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin routes with image upload
router.post('/', 
    authenticateAdmin, 
    checkPermission('manage_categories'), 
    upload.single('image'),
    handleMulterError,
    createCategory
);

router.put('/:id', 
    authenticateAdmin, 
    checkPermission('manage_categories'), 
    upload.single('image'),
    handleMulterError,
    updateCategory
);

router.delete('/:id', authenticateAdmin, checkPermission('manage_categories'), deleteCategory);

export default router;
