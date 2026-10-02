// Public deals and seller-owned promotion management.

import express from 'express';
import * as dealController from '../controllers/dealController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { blockIfSuspended } from '../middleware/suspension.js';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/mine', authMiddleware, roleMiddleware('seller'), dealController.getSellerPromotions);
router.post('/mine', authMiddleware, roleMiddleware('seller'), blockIfSuspended, dealController.createSellerPromotion);
router.delete('/mine/:id', authMiddleware, roleMiddleware('seller'), blockIfSuspended, dealController.deleteSellerPromotion);

// GET /api/deals — up to twelve in-stock products from open shops, newest first, each with
// a sale price and expiry time. Active seller promotions replace the default 20% offer.
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.id AS product_id, p.name, p.price, p.image_url, s.name AS store_name,
        ROUND(p.price * (1 - COALESCE(sp.discount_percent, 20) / 100), 2) AS sale_price,
        DATE_FORMAT(COALESCE(sp.ends_at, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 6 HOUR)), '%Y-%m-%dT%H:%i:%s.000Z') AS expires_at
      FROM products p
      JOIN stores s ON s.id = p.store_id
      LEFT JOIN seller_promotions sp ON sp.id = (
        SELECT MAX(sp2.id)
        FROM seller_promotions sp2
        WHERE sp2.product_id = p.id AND sp2.starts_at <= UTC_TIMESTAMP() AND sp2.ends_at > UTC_TIMESTAMP()
      )
      WHERE p.stock > 0 AND s.status = 'open'
      ORDER BY (sp.id IS NOT NULL) DESC, sp.featured DESC, p.id DESC
      LIMIT 12
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
