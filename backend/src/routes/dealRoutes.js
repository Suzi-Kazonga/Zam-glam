// Deals — the "today's offers" strip on the home page.
//
// The discount is worked out on the way out rather than stored: there is no promotions
// feature yet, so every in-stock product is shown at 20% off for the next six hours. When
// real promotions arrive, this is the one place that changes.

import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET /api/deals — up to twelve in-stock products from open shops, newest first, each with
// a sale price and an expiry time. Public: anybody can see the offers.
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.price, p.image_url, s.name AS store_name,
        ROUND(p.price * 0.8, 2) AS sale_price,
        DATE_ADD(NOW(), INTERVAL 6 HOUR) AS expires_at
      FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.stock > 0 AND s.status = 'open'
      ORDER BY p.id DESC
      LIMIT 12
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
