import express from 'express';
import orderController from '../controllers/OrderController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, requireRole('customer'), orderController.create);
router.get('/my-orders', authMiddleware, requireRole('customer'), orderController.list);
router.patch('/:id/status', authMiddleware, orderController.updateStatus);

export default router;
