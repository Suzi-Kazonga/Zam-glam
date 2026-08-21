import express from 'express';
import cartController from '../controllers/CartController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, cartController.view);
router.post('/add', authMiddleware, cartController.add);
router.delete('/remove/:id', authMiddleware, cartController.remove);

export default router;
