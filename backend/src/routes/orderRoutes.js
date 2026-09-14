import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { blockIfSuspended } from '../middleware/suspension.js';

const router = express.Router();

router.get('/', authMiddleware, orderController.getMyOrders);
// Before '/:id' so "quote" is not read as an order id.
router.post('/quote', authMiddleware, orderController.quoteOrder);
router.get('/:id', authMiddleware, orderController.getOrder);
router.post('/', authMiddleware, blockIfSuspended, orderController.createOrder);
router.patch('/:id/status', authMiddleware, orderController.updateOrderStatus);
// Per-store parcel within an order (multi-vendor orders ship as one parcel per store).
// The open pool must be declared before '/shipments/:id/...' so "available" is not an id.
router.get('/shipments/available', authMiddleware, orderController.getAvailableParcels);
router.get('/shipments/unclaimed', authMiddleware, roleMiddleware('admin'), orderController.getUnclaimedParcels);
router.get('/courier/shift', authMiddleware, roleMiddleware('courier'), orderController.getShift);
router.patch('/courier/shift', authMiddleware, roleMiddleware('courier'), blockIfSuspended, orderController.setShift);
// Handover takes both sides: the courier asks, the shop confirms (or says it never happened).
router.patch('/shipments/:id/pickup-request', authMiddleware, blockIfSuspended, orderController.requestPickupParcel);
router.patch('/shipments/:id/pickup-confirm', authMiddleware, blockIfSuspended, orderController.confirmPickupParcel);
router.patch('/shipments/:id/pickup-deny', authMiddleware, blockIfSuspended, orderController.denyPickupParcel);
// The customer's own confirmation that it arrived.
router.patch('/shipments/:id/confirm-delivery', authMiddleware, orderController.confirmDeliveryParcel);
router.patch('/shipments/:id/status', authMiddleware, blockIfSuspended, orderController.updateShipmentStatus);

export default router;
