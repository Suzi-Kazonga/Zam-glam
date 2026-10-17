import express from 'express';
import * as refundController from '../controllers/refundController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/my', refundController.getMyRequests);
router.get('/shipment/:shipmentId', refundController.getForShipment);
router.get('/admin', roleMiddleware('admin'), refundController.getAdminQueue);
router.patch('/admin/:id/decision', roleMiddleware('admin'), refundController.decide);
router.post('/', roleMiddleware('customer'), refundController.createRequest);
router.get('/:id', refundController.getRequest);
router.post('/:id/messages', refundController.addMessage);
router.patch('/:id/recommendation', roleMiddleware('seller'), refundController.submitRecommendation);

export default router;
