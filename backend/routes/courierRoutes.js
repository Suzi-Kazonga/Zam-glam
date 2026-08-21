import express from 'express';
import courierController from '../controllers/CourierController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/quote', authMiddleware, courierController.quote);

export default router;
