import express from 'express';
import authController from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const role = String(req.body?.role || 'customer').toLowerCase();
    if (role === 'seller') {
      return await authController.signupSeller(req, res, next);
    }
    return await authController.signupCustomer(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const role = String(req.body?.role || 'customer').toLowerCase();
    if (role === 'seller') {
      return await authController.loginSeller(req, res, next);
    }
    return await authController.loginCustomer(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post('/customer/signup', authController.signupCustomer);
router.post('/customer/login', authController.loginCustomer);
router.post('/seller/signup', authController.signupSeller);
router.post('/seller/login', authController.loginSeller);
router.get('/me', authMiddleware, (req, res) => res.json({ user: req.user }));

export default router;
