// Limits on how often something can be called, so one address cannot hammer the server.
//
// Every limit can be changed by environment variable — which is also how the tests set
// small limits to prove the limiters work, without slowing everything else down.

import rateLimit from 'express-rate-limit';

// Without this, login is open to brute force: an attacker can try passwords as fast as the
// server answers. bcrypt makes each guess slow, but nothing stopped the guessing.
//
// The limiter counts failures, not requests (skipSuccessfulRequests), so somebody signing
// in correctly several times — switching between the demo accounts, say — is never locked
// out, while repeated wrong passwords are.
export const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  limit: Number(process.env.LOGIN_MAX_ATTEMPTS) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many failed sign-in attempts. Please wait a few minutes and try again.',
  },
});

// Registration is cheap to call and writes a row every time, so it is capped per address
// to stop a script filling the accounts tables.
export const signupLimiter = rateLimit({
  windowMs: Number(process.env.SIGNUP_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  limit: Number(process.env.SIGNUP_MAX) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this address. Please try again later.' },
});

// A broad ceiling for everything else. Generous enough that the dashboards' polling
// (several requests every few seconds) never trips it.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.API_MAX_PER_MINUTE) || 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
