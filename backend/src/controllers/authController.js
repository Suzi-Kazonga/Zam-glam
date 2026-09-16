import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { pool } from '../config/db.js';
import { JWT_SECRET } from '../config/auth.js';
import { resolveSellerId, resolveCustomerId, resolveCourierId } from '../utils/accounts.js';

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

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, address, shop_name, location, city } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
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
      role: role || 'customer',
      address,
      shop_name,
      location: location || city,
    });

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email, role: role || 'customer' },
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
        role: role || 'customer',
        phone,
        address,
        location: location || city,
      },
    });
  } catch (error) {
    sendAuthError(res, error);
  }
};

// Login user
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

// Get current user
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
