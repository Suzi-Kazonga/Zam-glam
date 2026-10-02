import express from 'express';
import * as messageController from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/auth.js';
import { blockIfSuspended } from '../middleware/suspension.js';

const router = express.Router();

router.get('/threads', authMiddleware, messageController.listThreads);
router.get('/threads/:storeId', authMiddleware, messageController.getThread);
router.get('/threads/:storeId/:customerId', authMiddleware, messageController.getThread);
router.post('/threads/:storeId', authMiddleware, blockIfSuspended, messageController.sendMessage);
router.post('/threads/:storeId/:customerId', authMiddleware, blockIfSuspended, messageController.sendMessage);

export default router;