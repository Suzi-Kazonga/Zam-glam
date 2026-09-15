import { pool } from '../config/db.js';

export const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'];

// Vendor verification state. The proposal's first stated problem is that shoppers cannot
// tell a checked seller from an unchecked one, so this status is surfaced on storefronts
// and product listings.
class Seller {
  // One shop account.
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, shop_name, email, phone, verification_status, verified_at FROM sellers WHERE id = ?',
      [id],
    );
    return rows[0];
  }

  // Every shop for the admin review queue, with how much paperwork and stock each has.
  // Ordered so the ones waiting for a decision come first.
  static async findAllForReview() {
    const [rows] = await pool.query(
      `SELECT s.id, s.shop_name, s.email, s.phone, s.verification_status, s.verified_at,
              st.id AS store_id, st.name AS store_name,
              (SELECT COUNT(*) FROM documents d WHERE d.seller_id = s.id) AS document_count,
              (SELECT COUNT(*) FROM products p WHERE p.seller_id = s.id) AS product_count
       FROM sellers s
       LEFT JOIN stores st ON st.seller_id = s.id
       ORDER BY FIELD(s.verification_status, 'pending', 'rejected', 'verified'), s.id`,
    );
    return rows;
  }

  // Record an administrator’s decision. Approving stamps the time, so a badge can say when
  // the shop was checked; anything else clears it.
  static async setVerificationStatus(id, status) {
    const [result] = await pool.query(
      `UPDATE sellers SET verification_status = ?, verified_at = ${status === 'verified' ? 'CURRENT_TIMESTAMP' : 'NULL'} WHERE id = ?`,
      [status, id],
    );
    return result.affectedRows > 0;
  }
}

export default Seller;
