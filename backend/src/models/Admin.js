import { pool } from '../config/db.js';

// Everything the admin console shows comes from here. It previously read a hardcoded
// list in the browser's localStorage, so the counts, the accounts and their statuses
// were all invented — deleting an account changed nothing real.
class Admin {
  // Headline numbers for the dashboard.
  static async stats() {
    const one = async (sql) => {
      const [rows] = await pool.query(sql);
      return Number(rows[0]?.n || 0);
    };

    const [
      customers, sellers, couriers, admins,
      shopsPending, couriersPending,
      orders, products, stores, reviews,
    ] = await Promise.all([
      one('SELECT COUNT(*) n FROM customers'),
      one('SELECT COUNT(*) n FROM sellers'),
      one('SELECT COUNT(*) n FROM couriers'),
      one('SELECT COUNT(*) n FROM admins'),
      one("SELECT COUNT(*) n FROM sellers WHERE verification_status = 'pending'"),
      one("SELECT COUNT(*) n FROM couriers WHERE approval_status = 'pending'"),
      one('SELECT COUNT(*) n FROM orders'),
      one('SELECT COUNT(*) n FROM products'),
      one('SELECT COUNT(*) n FROM stores'),
      one('SELECT COUNT(*) n FROM reviews'),
    ]);

    return {
      subscribers: {
        customers,
        sellers,
        couriers,
        admins,
        total: customers + sellers + couriers + admins,
      },
      pending: {
        shops: shopsPending,
        couriers: couriersPending,
        total: shopsPending + couriersPending,
      },
      activity: { orders, products, stores, reviews },
    };
  }

  static async customers() {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.email, c.phone, c.address, c.location, c.created_at,
              (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS order_count,
              (SELECT COALESCE(SUM(o.total_price), 0) FROM orders o WHERE o.customer_id = c.id) AS total_spent
       FROM customers c ORDER BY c.created_at DESC, c.id DESC`,
    );
    return rows;
  }

  static async sellers() {
    const [rows] = await pool.query(
      `SELECT s.id, s.shop_name AS name, s.email, s.phone, s.verification_status, s.verified_at, s.created_at,
              st.id AS store_id, st.name AS store_name, st.location,
              (SELECT COUNT(*) FROM products p WHERE p.seller_id = s.id) AS product_count,
              (SELECT COUNT(*) FROM shipments sh WHERE sh.seller_id = s.id) AS parcel_count,
              COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.seller_id = s.id), 1), 0) AS rating,
              (SELECT COUNT(*) FROM documents d WHERE d.seller_id = s.id) AS document_count
       FROM sellers s LEFT JOIN stores st ON st.seller_id = s.id
       ORDER BY FIELD(s.verification_status, 'pending', 'rejected', 'verified'), s.id`,
    );
    return rows;
  }

  static async couriers() {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.email, c.phone, c.on_shift, c.is_active,
              c.approval_status, c.approved_at, c.created_at,
              (SELECT COUNT(*) FROM shipments sh WHERE sh.courier_id = c.id) AS parcels_taken,
              (SELECT COUNT(*) FROM shipments sh WHERE sh.courier_id = c.id AND sh.status = 'delivered') AS parcels_delivered
       FROM couriers c
       ORDER BY FIELD(c.approval_status, 'pending', 'rejected', 'approved'), c.id`,
    );
    return rows;
  }

  // Registrations waiting on a decision: shops that have submitted paperwork, and
  // courier sign-ups that have not been let in yet.
  static async pendingRegistrations() {
    const [shops] = await pool.query(
      `SELECT s.id, s.shop_name AS name, s.email, s.phone, s.created_at,
              (SELECT COUNT(*) FROM documents d WHERE d.seller_id = s.id) AS document_count
       FROM sellers s WHERE s.verification_status = 'pending' ORDER BY s.created_at ASC, s.id`,
    );
    const [couriers] = await pool.query(
      `SELECT id, name, email, phone, created_at
       FROM couriers WHERE approval_status = 'pending' ORDER BY created_at ASC, id`,
    );
    return { shops, couriers, total: shops.length + couriers.length };
  }

  static async setCourierApproval(id, status) {
    const [result] = await pool.query(
      `UPDATE couriers
       SET approval_status = ?,
           approved_at = ${status === 'approved' ? 'CURRENT_TIMESTAMP' : 'NULL'},
           is_active = ?,
           on_shift = CASE WHEN ? = 'approved' THEN on_shift ELSE 0 END
       WHERE id = ?`,
      [status, status === 'approved' ? 1 : 0, status, id],
    );
    return result.affectedRows > 0;
  }
}

export default Admin;
