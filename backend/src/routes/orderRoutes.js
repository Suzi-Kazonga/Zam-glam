import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const isSeller = req.user.role === 'seller';
    const query = isSeller
      ? `SELECT o.id, oi.quantity, o.status, o.created_at, p.name, oi.price
         FROM orders o JOIN order_items oi ON oi.order_id = o.id
         JOIN products p ON p.id = oi.product_id
         JOIN sellers s ON s.id = p.seller_id WHERE s.user_id = ? ORDER BY o.created_at DESC`
      : `SELECT o.id, oi.quantity, o.status, o.created_at, p.name, oi.price, p.image_url
         FROM orders o JOIN order_items oi ON oi.order_id = o.id
         JOIN products p ON p.id = oi.product_id WHERE o.customer_id = ? ORDER BY o.created_at DESC`;
    const [orders] = await pool.query(query, [req.user.id]);
    res.json(orders);
  } catch (error) { next(error); }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id || quantity < 1) return res.status(400).json({ error: 'product_id and a positive quantity are required' });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [products] = await connection.query('SELECT price FROM products WHERE id = ?', [product_id]);
      if (!products[0]) return res.status(404).json({ error: 'Product not found' });
      const total = Number(products[0].price) * quantity;
      const [order] = await connection.query('INSERT INTO orders (customer_id, total_price) VALUES (?, ?)', [req.user.id, total]);
      await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [order.insertId, product_id, quantity, products[0].price]);
      await connection.commit();
      res.status(201).json({ id: order.insertId, status: 'pending' });
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  } catch (error) { next(error); }
});

router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (error) { next(error); }
});

export default router;
