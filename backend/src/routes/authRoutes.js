import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { loginLimiter, signupLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Public routes
router.post('/register', signupLimiter, authController.register);
router.post('/signup', signupLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
