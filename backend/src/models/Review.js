import { pool } from '../config/db.js';
import { resolveCustomerId, resolveSellerId } from '../utils/accounts.js';

// Seller ratings. A rating is tied to a delivered order, so only someone who actually
// bought from a shop — and received it — can score that shop.
class Review {
  // Every rating left about one shop, newest first, with the shop’s replies.
  static async findBySeller(seller_id) {
    const [rows] = await pool.query(
      `SELECT r.*, c.name AS customer_name
       FROM reviews r LEFT JOIN customers c ON c.id = r.customer_id
       WHERE r.seller_id = ? ORDER BY r.created_at DESC`,
      [seller_id],
    );
    return rows;
  }

  // A shop’s average score and how many ratings it is based on.
  static async scoreForSeller(seller_id) {
    const [rows] = await pool.query(
      'SELECT ROUND(AVG(rating), 1) AS average, COUNT(*) AS count FROM reviews WHERE seller_id = ?',
      [seller_id],
    );
    return { average: Number(rows[0]?.average || 0), count: Number(rows[0]?.count || 0) };
  }

  // What one shopper has already rated, so the app knows which orders still need one.
  static async findByCustomer(customer_id) {
    const [rows] = await pool.query(
      `SELECT r.*, s.shop_name FROM reviews r JOIN sellers s ON s.id = r.seller_id
       WHERE r.customer_id = ? ORDER BY r.created_at DESC`,
      [customer_id],
    );
    return rows;
  }

  // The customer must have bought from this shop on this order, and the parcel must have
  // been delivered — you cannot rate a shop you never used, or one still mid-delivery.
  // May this person rate this shop at all?
  //
  // Only somebody who bought from the shop on this order, and had it delivered. Without
  // this, anybody could score any shop without ever buying from it.
  static async assertCanReview({ user_id, seller_id, order_id }) {
    const customerId = await resolveCustomerId(user_id);
    if (!customerId) throw Object.assign(new Error('Customer profile not found'), { status: 404 });

    const [rows] = await pool.query(
      `SELECT sh.status FROM shipments sh
       JOIN orders o ON o.id = sh.order_id
       WHERE sh.order_id = ? AND sh.seller_id = ? AND o.customer_id = ?`,
      [order_id, seller_id, customerId],
    );
    if (!rows.length) throw Object.assign(new Error('You did not order from this shop'), { status: 403 });
    if (rows[0].status !== 'delivered') {
      throw Object.assign(new Error('You can rate a shop once your parcel has been delivered'), { status: 409 });
    }
    return customerId;
  }

  // Save a rating, replacing this customer’s earlier one for the same shop and order.
  //
  // The unique key on (customer, order, seller) is what makes that work: a second insert
  // hits it and updates instead, so one person cannot pile up scores against a shop.
  static async upsert({ user_id, seller_id, order_id, rating, comment }) {
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      throw Object.assign(new Error('Rating must be a whole number from 1 to 5'), { status: 400 });
    }

    const customerId = await Review.assertCanReview({ user_id, seller_id, order_id });

    // Re-rating the same order replaces the previous score rather than stacking.
    await pool.query(
      `INSERT INTO reviews (seller_id, customer_id, order_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = CURRENT_TIMESTAMP`,
      [seller_id, customerId, order_id, numericRating, comment || null],
    );

    return Review.scoreForSeller(seller_id);
  }

  // Only the shop being reviewed may reply.
  // The shop answers a rating. Only the shop that rating is about may reply to it.
  static async reply({ user_id, review_id, reply }) {
    const sellerId = await resolveSellerId(user_id);
    if (!sellerId) throw Object.assign(new Error('Seller profile not found'), { status: 404 });

    const [result] = await pool.query(
      'UPDATE reviews SET reply = ?, replied_at = CURRENT_TIMESTAMP WHERE id = ? AND seller_id = ?',
      [reply, review_id, sellerId],
    );
    if (result.affectedRows === 0) {
      throw Object.assign(new Error('That review is not on your shop'), { status: 403 });
    }
    return true;
  }
}

export default Review;
