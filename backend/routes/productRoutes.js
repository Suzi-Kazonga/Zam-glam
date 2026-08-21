import express from 'express';
import productController from '../controllers/ProductController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', productController.list);
router.get('/:id', productController.getById);
router.get('/seller/my-products', authMiddleware, requireRole('seller'), productController.sellerProducts);
router.post('/', authMiddleware, requireRole('seller'), productController.create);
router.put('/:id', authMiddleware, requireRole('seller'), productController.update);
router.delete('/:id', authMiddleware, requireRole('seller'), productController.remove);

export default router;
