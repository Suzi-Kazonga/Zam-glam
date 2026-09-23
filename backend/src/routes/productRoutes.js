import express from 'express';
import * as productController from '../controllers/productController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { blockIfSuspended } from '../middleware/suspension.js';

const router = express.Router();

// Public routes
router.get('/', productController.getFilteredProducts);
router.get('/:id', productController.getProduct);

// Seller routes (protected)
// Up to 6 photos per listing; 'image' is kept for older single-file callers.
const productImages = upload.fields([{ name: 'images', maxCount: 6 }, { name: 'image', maxCount: 1 }]);

router.post('/', authMiddleware, roleMiddleware('seller'), blockIfSuspended, productImages, productController.createProduct);
router.get('/seller/my-products', authMiddleware, roleMiddleware('seller'), productController.getSellerProducts);
router.put('/:id', authMiddleware, roleMiddleware('seller'), productImages, productController.updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('seller'), productController.deleteProduct);

export default router;
