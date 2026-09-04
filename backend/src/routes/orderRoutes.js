import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, orderController.getMyOrders);
// Before '/:id' so "quote" is not read as an order id.
router.post('/quote', authMiddleware, orderController.quoteOrder);
router.get('/:id', authMiddleware, orderController.getOrder);
router.post('/', authMiddleware, orderController.createOrder);
router.patch('/:id/status', authMiddleware, orderController.updateOrderStatus);
// Per-store parcel within an order (multi-vendor orders ship as one parcel per store).
router.patch('/shipments/:id/status', authMiddleware, orderController.updateShipmentStatus);

export default router;
