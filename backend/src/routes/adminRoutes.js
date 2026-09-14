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

// Account management. Deletion is a soft delete with a grace period and a restore.
router.patch('/:role/:id', adminController.editAccount);
router.delete('/:role/:id', adminController.deleteAccount);
router.patch('/:role/:id/restore', adminController.restoreAccount);

export default router;
