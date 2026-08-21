import express from 'express';
import * as productController from '../controllers/productController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', productController.getFilteredProducts);
router.get('/:id', productController.getProduct);

// Seller routes (protected)
router.post('/', authMiddleware, roleMiddleware('seller'), upload.single('image'), productController.createProduct);
router.get('/seller/my-products', authMiddleware, roleMiddleware('seller'), productController.getSellerProducts);
router.put('/:id', authMiddleware, roleMiddleware('seller'), productController.updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('seller'), productController.deleteProduct);

export default router;
