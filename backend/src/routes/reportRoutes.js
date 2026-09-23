import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Any signed-in party can check their own standing and file a complaint. A suspended
// account is deliberately still allowed to report, so being suspended does not silence
// someone with a genuine grievance.
router.get('/me/standing', reportController.getMyStanding);
router.get('/order/:orderId/parties', reportController.getReportableParties);
router.post('/', reportController.createReport);

// Admin review and moderation.
router.get('/admin/summary', roleMiddleware('admin'), reportController.getReportSummary);
router.get('/admin/:role/:id', roleMiddleware('admin'), reportController.getReportsAgainst);
router.patch('/admin/:role/:id/status', roleMiddleware('admin'), reportController.setAccountStatus);

export default router;
