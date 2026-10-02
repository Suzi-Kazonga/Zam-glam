import { pool } from '../config/db.js';
import { resolveSellerId } from '../utils/accounts.js';

function sqlDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export async function getSellerPromotions(req, res) {
  try {
    const sellerId = await resolveSellerId(req.user.id);
    if (!sellerId) return res.status(404).json({ error: 'Seller profile not found' });

    const [promotions] = await pool.query(
      `SELECT promotion.id, promotion.product_id, product.name AS product_name,
        promotion.discount_percent, promotion.featured,
        DATE_FORMAT(promotion.starts_at, '%Y-%m-%dT%H:%i:%s.000Z') AS starts_at,
        DATE_FORMAT(promotion.ends_at, '%Y-%m-%dT%H:%i:%s.000Z') AS ends_at
       FROM seller_promotions promotion
       JOIN products product ON product.id = promotion.product_id
       WHERE promotion.seller_id = ?
       ORDER BY promotion.created_at DESC`,
      [sellerId],
    );
    return res.json(promotions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createSellerPromotion(req, res) {
  try {
    const sellerId = await resolveSellerId(req.user.id);
    if (!sellerId) return res.status(404).json({ error: 'Seller profile not found' });

    const productId = Number(req.body.product_id);
    const discount = Number(req.body.discount_percent);
    const startsAt = sqlDate(req.body.starts_at);
    const endsAt = sqlDate(req.body.ends_at);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(discount) || discount < 1 || discount > 90) {
      return res.status(400).json({ error: 'Choose a product and a discount from 1 to 90 percent' });
    }
    if (!startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) {
      return res.status(400).json({ error: 'Choose valid promotion start and end times' });
    }

    const [ownedProduct] = await pool.query(
      'SELECT id FROM products WHERE id = ? AND seller_id = ?',
      [productId, sellerId],
    );
    if (!ownedProduct.length) return res.status(404).json({ error: 'Product not found in your shop' });

    const [result] = await pool.query(
      `INSERT INTO seller_promotions
        (seller_id, product_id, discount_percent, featured, starts_at, ends_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sellerId, productId, discount, req.body.featured ? 1 : 0, startsAt, endsAt],
    );
    const [rows] = await pool.query(
      `SELECT promotion.id, promotion.product_id, product.name AS product_name,
        promotion.discount_percent, promotion.featured,
        DATE_FORMAT(promotion.starts_at, '%Y-%m-%dT%H:%i:%s.000Z') AS starts_at,
        DATE_FORMAT(promotion.ends_at, '%Y-%m-%dT%H:%i:%s.000Z') AS ends_at
       FROM seller_promotions promotion
       JOIN products product ON product.id = promotion.product_id
       WHERE promotion.id = ? AND promotion.seller_id = ?`,
      [result.insertId, sellerId],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteSellerPromotion(req, res) {
  try {
    const sellerId = await resolveSellerId(req.user.id);
    if (!sellerId) return res.status(404).json({ error: 'Seller profile not found' });

    const [result] = await pool.query(
      'DELETE FROM seller_promotions WHERE id = ? AND seller_id = ?',
      [Number(req.params.id), sellerId],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Promotion not found' });
    return res.json({ message: 'Promotion removed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}