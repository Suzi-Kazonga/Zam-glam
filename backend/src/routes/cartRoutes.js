import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { pool } from '../config/db.js';
import { resolveCustomerId } from '../utils/accounts.js';

const router = express.Router();

// A server-side cart, so a basket survives changing device. The browser keeps its own copy
// for speed; this is the one that outlives it.
//
// These queries used to join `customers.user_id` directly, which only exists on the older
// account layout — on a current database every call answered 500. Account ids go through
// resolveCustomerId like everywhere else.
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const customerId = await resolveCustomerId(req.user.id);
    if (!customerId) return res.status(404).json({ error: 'Customer profile not found' });

    const [rows] = await pool.query(
      `SELECT c.product_id AS id, c.quantity, p.name, p.price, p.image_url, p.stock
       FROM cart c JOIN products p ON p.id = c.product_id
       WHERE c.customer_id = ?`,
      [customerId],
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id || quantity < 1) return res.status(400).json({ error: 'product_id and a positive quantity are required' });

    const [rows] = await pool.query('SELECT id, name, price, stock, image_url FROM products WHERE id = ?', [product_id]);
    if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
    if (rows[0].stock < quantity) return res.status(409).json({ error: 'Not enough stock' });

    const customerId = await resolveCustomerId(req.user.id);
    if (!customerId) return res.status(404).json({ error: 'Customer profile not found' });

    await pool.query(
      `INSERT INTO cart (customer_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [customerId, product_id, quantity],
    );
    res.status(201).json({ message: 'Product added to cart', item: { ...rows[0], quantity } });
  } catch (error) { next(error); }
});

export default router;
