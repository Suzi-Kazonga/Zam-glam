import express from 'express';
import authController from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/customer/signup', authController.signupCustomer);
router.post('/customer/login', authController.loginCustomer);
router.post('/seller/signup', authController.signupSeller);
router.post('/seller/login', authController.loginSeller);
router.get('/me', authMiddleware, (req, res) => res.json({ user: req.user }));

export default router;
