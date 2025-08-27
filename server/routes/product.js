import express from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductImage,
    getFeaturedProducts,
    getProductsByCategory,
    getProductReviews,
    searchProducts,
    addProductReview,
    getRecentReviews
} from '../controllers/product.js';
import { authenticateUser, authenticateAdmin, checkPermission } from '../middleware/auth.js';
import { upload, handleMulterError } from '../middleware/upload.js';
import { validateProduct , validateReview} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);
router.get('/:productId/reviews', getProductReviews);
router.get('/reviews/recent', getRecentReviews);

// User routes
router.post('/:productId/review', authenticateUser,validateReview, addProductReview);

// Admin routes
router.post('/', 
    authenticateAdmin, 
    checkPermission('manage_products'),
    upload.array('images', 5),
    handleMulterError,
    createProduct
);

router.put('/:id', 
    authenticateAdmin, 
    checkPermission('manage_products'),
    upload.array('images', 5),
    handleMulterError,
    updateProduct
);

// Text-only update route (no file upload)
router.put('/:id/text-only', 
    authenticateAdmin, 
    checkPermission('manage_products'),
    updateProduct
);

// Text-only create route (no file upload)
router.post('/text-only', 
    authenticateAdmin, 
    checkPermission('manage_products'),
    createProduct
);

router.delete('/:id', 
    authenticateAdmin, 
    checkPermission('manage_products'),
    deleteProduct
);

router.delete('/:productId/images/:imageId', 
    authenticateAdmin, 
    checkPermission('manage_products'),
    deleteProductImage
);

export default router;
