import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, orderController.getMyOrders);
router.get('/:id', authMiddleware, orderController.getOrder);
router.post('/', authMiddleware, orderController.createOrder);
router.patch('/:id/status', authMiddleware, orderController.updateOrderStatus);

export default router;
