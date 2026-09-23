// Complaints between the parties on an order, and the moderation that follows.
//
// A shopper, a shop and a courier all meet on one order, and any of them can go wrong. A
// complaint can only be made about somebody you actually dealt with, and three complaints
// against the same party raise a flag for an administrator.

import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Nothing here is public — every route needs a signed-in account.
router.use(authMiddleware);

// What any signed-in party may do.
//
// Note there is deliberately no suspension check on these: a suspended account can still
// file a complaint, so being suspended does not silence somebody with a genuine grievance
// about the shop or courier who got them suspended.
router.get('/me/standing', reportController.getMyStanding);                  // am I suspended, and why?
router.get('/order/:orderId/parties', reportController.getReportableParties); // who else was on this order?
router.post('/', reportController.createReport);                             // file a complaint

// What an administrator may do: see who has complaints against them, read them, and
// suspend or reinstate the account. The role check is on each route because the ones above
// are open to everybody.
router.get('/admin/summary', roleMiddleware('admin'), reportController.getReportSummary);
router.get('/admin/:role/:id', roleMiddleware('admin'), reportController.getReportsAgainst);
router.patch('/admin/:role/:id/status', roleMiddleware('admin'), reportController.setAccountStatus);

export default router;
