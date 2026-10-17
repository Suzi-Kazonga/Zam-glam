// Customer service: problems with Zamglam reported by the people using it.
//
// A complaint about another party on an order goes through reportRoutes.js instead. This
// is the route a "Report a problem" button posts to, and the queue the administrators
// work through.

import express from 'express';
import * as supportController from '../controllers/supportController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Nothing here is public.
router.use(authMiddleware);

// Anybody signed in except an administrator. Deliberately no suspension check: somebody
// suspended by mistake must still be able to say so.
router.post('/problems', supportController.reportProblem);   // report a problem
router.get('/problems/mine', supportController.getMyProblems); // what I have reported

// The administrators' queue.
router.get('/problems', roleMiddleware('admin'), supportController.listProblems);
router.get('/problems/count', roleMiddleware('admin'), supportController.getOpenCount);
router.patch('/problems/:id/done', roleMiddleware('admin'), supportController.markProblemDone);
router.patch('/problems/:id/reopen', roleMiddleware('admin'), supportController.reopenProblem);

export default router;
