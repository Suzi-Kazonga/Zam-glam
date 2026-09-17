// Signing up and signing in.
//
// A successful sign-in hands back a token that stands in for the password on every
// request after it. The token says who the account is and what kind it is, and is signed
// so it cannot be edited: change a single character and the signature stops matching.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { pool } from '../config/db.js';
import { JWT_SECRET } from '../config/auth.js';
import { resolveSellerId, resolveCustomerId, resolveCourierId } from '../utils/accounts.js';

const SELF_SERVICE_ROLES = ['customer', 'seller', 'courier'];

function isDatabaseUnavailable(error) {
  return ['ECONNREFUSED', 'ECONNRESET', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT'].includes(error.code);
}

function sendAuthError(res, error) {
  if (isDatabaseUnavailable(error)) {
    return res.status(503).json({ error: 'Database unavailable. Start MySQL and try again.' });
  }

  return res.status(500).json({ error: error.message });
}

// A deleted account keeps its row for a grace period so an admin can undo a mistake.
// Nobody should be able to sign back into it meanwhile.
async function deletedAtFor(user) {
  const table = { seller: 'sellers', customer: 'customers', courier: 'couriers' }[user.role];
  if (!table) return null;
  const resolve = { seller: resolveSellerId, customer: resolveCustomerId, courier: resolveCourierId }[user.role];
  const profileId = await resolve(user.id);
  if (!profileId) return null;
  const [rows] = await pool.query(`SELECT deleted_at FROM ${table} WHERE id = ?`, [profileId]);
  return rows[0]?.deleted_at || null;
}

// Create an account and sign it straight in, so nobody has to type their password twice.
//
// What kind of account is created depends on `role`. A shop can list things immediately
// but shows as unverified until its paperwork is checked; a courier cannot work at all
// until an administrator approves it.
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, shop_name, location, city, accepted_terms } = req.body;
    const role = req.body.role || 'customer';

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Only the three public kinds of account can be made from the sign-up page. Without
    // this, anybody could send role "admin" and give themselves the admin console.
    // Administrators are created by someone with access to the server (see seed.js).
    if (!SELF_SERVICE_ROLES.includes(role)) {
      return res.status(400).json({ error: 'You can sign up as a customer, a seller or a courier' });
    }

    // Consent to the terms is part of making an account, not a box ticked in the browser
    // alone: it is checked here, and when it was given is kept on the account.
    if (accepted_terms !== true) {
      return res.status(400).json({ error: 'You must accept the terms and conditions to create an account' });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user
    const userId = await User.create({
      name,
      email,
      password,
      phone,
      role,
      address,
      shop_name,
      location: location || city,
    });

    const table = { seller: 'sellers', customer: 'customers', courier: 'couriers' }[role];
    const resolve = { seller: resolveSellerId, customer: resolveCustomerId, courier: resolveCourierId }[role];
    const profileId = await resolve(userId);
    if (profileId) {
      await pool.query(`UPDATE ${table} SET terms_accepted_at = CURRENT_TIMESTAMP WHERE id = ?`, [profileId]);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { 
        id: userId, 
        name, 
        email, 
        role,
        phone,
        address,
        location: location || city,
      },
    });
  } catch (error) {
    sendAuthError(res, error);
  }
};

// Sign in with an email and password.
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // A removed account cannot sign in, even while it is still restorable.
    if (await deletedAtFor(user)) {
      return res.status(403).json({ error: 'This account has been removed. Contact Zamglam support.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    sendAuthError(res, error);
  }
};

// Who is signed in, according to the token. The app calls this on startup to check a
// stored token is still good before showing somebody their dashboard.
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
