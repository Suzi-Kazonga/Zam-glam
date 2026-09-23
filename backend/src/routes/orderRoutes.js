// Orders, parcels and the handover between a shop and a courier.
//
// An order placed across several shops is split into one PARCEL per shop (a "shipment" in
// the database). Each parcel is packed, collected and delivered separately, so most of the
// routes below act on a parcel rather than on the whole order.

import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { blockIfSuspended } from '../middleware/suspension.js';

const router = express.Router();

// --- Orders -----------------------------------------------------------------------
//
// What '/' returns depends on who is asking: their own orders for a shopper, orders
// containing their products for a shop, parcels they are carrying for a courier.
router.get('/', authMiddleware, orderController.getMyOrders);

// Price a basket before it is placed. Declared before '/:id', or Express would read the
// word "quote" as an order id.
router.post('/quote', authMiddleware, orderController.quoteOrder);

router.get('/:id', authMiddleware, orderController.getOrder);
router.post('/', authMiddleware, blockIfSuspended, orderController.createOrder);
router.patch('/:id/status', authMiddleware, orderController.updateOrderStatus);

// --- The pickup pool --------------------------------------------------------------
//
// Parcels a shop has released and no courier has taken yet. Both paths start with
// '/shipments/' and must come before '/shipments/:id/...', or "available" and "unclaimed"
// would be read as parcel ids.
router.get('/shipments/available', authMiddleware, orderController.getAvailableParcels);
router.get('/shipments/unclaimed', authMiddleware, roleMiddleware('admin'), orderController.getUnclaimedParcels);

// --- Courier duty -----------------------------------------------------------------
//
// Only couriers on duty are shown the pool or given parcels automatically.
router.get('/courier/shift', authMiddleware, roleMiddleware('courier'), orderController.getShift);
router.patch('/courier/shift', authMiddleware, roleMiddleware('courier'), blockIfSuspended, orderController.setShift);

// --- The handover -----------------------------------------------------------------
//
// It takes both sides. The courier asks for the parcel, and the shop says whether the
// handover really happened. A courier pressing "collected" is only their word for it,
// so nothing is treated as collected until the shop confirms.
router.patch('/shipments/:id/pickup-request', authMiddleware, blockIfSuspended, orderController.requestPickupParcel); // courier asks
router.patch('/shipments/:id/pickup-confirm', authMiddleware, blockIfSuspended, orderController.confirmPickupParcel); // shop says yes
router.patch('/shipments/:id/pickup-deny', authMiddleware, blockIfSuspended, orderController.denyPickupParcel);       // shop says they never came

// Moving one shop's parcel along, leaving the other shops' parcels in the same order alone.
router.patch('/shipments/:id/status', authMiddleware, blockIfSuspended, orderController.updateShipmentStatus);

export default router;
