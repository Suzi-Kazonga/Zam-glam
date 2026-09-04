import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, orderController.getMyOrders);
router.get('/:id', authMiddleware, orderController.getOrder);
router.post('/', authMiddleware, orderController.createOrder);
router.patch('/:id/status', authMiddleware, orderController.updateOrderStatus);
// Per-store parcel within an order (multi-vendor orders ship as one parcel per store).
router.patch('/shipments/:id/status', authMiddleware, orderController.updateShipmentStatus);

export default router;
