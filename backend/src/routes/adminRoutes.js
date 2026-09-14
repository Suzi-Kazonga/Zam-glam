import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Everything here exposes other people's account details, so it is admin-only.
router.use(authMiddleware, roleMiddleware('admin'));

router.get('/stats', adminController.getStats);
router.get('/pending', adminController.getPendingRegistrations);
router.get('/users/:role', adminController.getUsers);
router.patch('/couriers/:id/approval', adminController.reviewCourier);

export default router;
