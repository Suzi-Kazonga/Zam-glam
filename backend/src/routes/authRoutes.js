// Signing up and signing in — the only routes anybody can reach without an account.

import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { loginLimiter, signupLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Open to anybody, and therefore rate limited.
//
// signupLimiter caps how many accounts one address can create, so a script cannot fill the
// accounts tables. loginLimiter counts *failed* sign-ins only, so guessing passwords gets
// slower while somebody switching between their own accounts never gets locked out.
//
// '/register' and '/signup' are the same handler under two names, because both spellings
// were already in use by the time this was tidied up.
router.post('/register', signupLimiter, authController.register);
router.post('/signup', signupLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);

// Who am I? Used by the app on startup to check a stored token is still good.
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
