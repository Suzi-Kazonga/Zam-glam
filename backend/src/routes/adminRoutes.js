// The admin console — figures, approvals and account management.
//
// Everything an administrator does to somebody else's account goes through here, and all
// of it writes to the database. The console used to read a hardcoded list in the browser,
// so its numbers were invented and its buttons changed nothing real.

import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Every route below exposes other people's personal details, so the check is applied once
// here to the whole router rather than being repeated — and cannot be forgotten on a new
// route added later.
router.use(authMiddleware, roleMiddleware('admin'));

// Reading: the dashboard figures, who is waiting for a decision, and each group of accounts.
router.get('/stats', adminController.getStats);
router.get('/pending', adminController.getPendingRegistrations);
router.get('/users/:role', adminController.getUsers);       // role: customers | sellers | couriers

// Letting a new courier start work, or turning them away.
router.patch('/couriers/:id/approval', adminController.reviewCourier);

// Managing one account. These take the role in the singular — seller, customer, courier.
//
// Deleting is reversible: the account is hidden and blocked for a grace period (30 days by
// default) and can be restored, after which a scheduled job removes it for good.
router.patch('/:role/:id', adminController.editAccount);
router.delete('/:role/:id', adminController.deleteAccount);
router.patch('/:role/:id/restore', adminController.restoreAccount);

export default router;
