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
      // So the console quotes the same restore window the purge job actually enforces.
      grace_days: Admin.GRACE_DAYS,
    };
  }

  // Every shopper, with how much they have ordered and spent — the figures the admin
  // console shows beside each name.
  static async customers() {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.email, c.phone, c.address, c.location, c.created_at,
              c.account_status, c.deleted_at,
              (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS order_count,
              (SELECT COALESCE(SUM(o.total_price), 0) FROM orders o WHERE o.customer_id = c.id) AS total_spent
       FROM customers c ORDER BY c.created_at DESC, c.id DESC`,
    );
    return rows;
  }

  // Every shop, with its verification state, stock, parcels and rating. Shops waiting for
  // a decision are listed first, since those are the ones needing attention.
  static async sellers() {
    const [rows] = await pool.query(
      `SELECT s.id, s.shop_name AS name, s.email, s.phone, s.verification_status, s.verified_at, s.created_at,
              s.account_status, s.deleted_at,
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

  // Every rider, with whether they are approved, on duty, and how many parcels they have
  // carried and delivered. Sign-ups awaiting approval come first.
  static async couriers() {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.email, c.phone, c.on_shift, c.is_active, c.account_status, c.deleted_at,
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

  // Record the decision on a courier sign-up.
  //
  // Anything other than approval also deactivates the account and takes them off duty, so
  // a rejected rider cannot keep working through a page they already had open.
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

  // Deleting an account keeps the row for a grace period so a mistake can be undone.
  // Only after GRACE_DAYS with nobody restoring it is the account actually removed.
  static get GRACE_DAYS() { return Number(process.env.ACCOUNT_DELETE_GRACE_DAYS) || 30; }

  // Turn a role name into its table, refusing anything unexpected.
  //
  // These table names are put straight into SQL, so this is also what stops a made-up role
  // in the URL reaching the database.
  static tableFor(role) {
    const map = { seller: 'sellers', customer: 'customers', courier: 'couriers' };
    const table = map[role];
    if (!table) throw Object.assign(new Error('Unknown account type'), { status: 400 });
    return table;
  }

  // Delete an account — reversibly.
  //
  // Nothing is actually removed: the row is stamped with the time, which is enough to stop
  // it signing in, take its products out of the catalogue, and grey it out in the console.
  // A mistake can be undone until the grace period runs out.
  static async softDelete(role, id) {
    const table = Admin.tableFor(role);
    const [result] = await pool.query(
      `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    if (result.affectedRows === 0) throw Object.assign(new Error('Account not found, or already deleted'), { status: 404 });

    // A deleted courier must not stay on duty holding parcels open for collection.
    if (role === 'courier') await pool.query('UPDATE couriers SET on_shift = 0, is_active = 0 WHERE id = ?', [id]);

    return { role, id: Number(id), deleted: true, grace_days: Admin.GRACE_DAYS };
  }

  // Undo a deletion inside the grace period.
  static async restore(role, id) {
    const table = Admin.tableFor(role);
    const [result] = await pool.query(
      `UPDATE ${table} SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL`,
      [id],
    );
    if (result.affectedRows === 0) throw Object.assign(new Error('Account not found, or not deleted'), { status: 404 });
    if (role === 'courier') await pool.query("UPDATE couriers SET is_active = 1 WHERE id = ? AND approval_status = 'approved'", [id]);
    return { role, id: Number(id), deleted: false };
  }

  // Runs on a schedule. Anything past the grace period goes for good.
  static async purgeExpired() {
    const removed = [];
    for (const [role, table] of [['seller', 'sellers'], ['customer', 'customers'], ['courier', 'couriers']]) {
      const [rows] = await pool.query(
        `SELECT id FROM ${table} WHERE deleted_at IS NOT NULL AND deleted_at < (CURRENT_TIMESTAMP - INTERVAL ? DAY)`,
        [Admin.GRACE_DAYS],
      );
      for (const row of rows) {
        try {
          await pool.query(`DELETE FROM ${table} WHERE id = ?`, [row.id]);
          removed.push({ role, id: row.id });
        } catch (error) {
          // A row still referenced by orders cannot be removed; leave it deleted-but-present
          // rather than destroying order history.
          console.warn(`Could not purge ${role} ${row.id}: ${error.code || error.message}`);
        }
      }
    }
    return removed;
  }

  // Editing an account's own details from the console.
  // Correct an account’s details from the console.
  //
  // Only the columns listed per role may be written. Anything else in the request is
  // ignored, so a password can never be set through this endpoint.
  static async updateAccount(role, id, fields) {
    const table = Admin.tableFor(role);
    const allowed = {
      seller: ['shop_name', 'email', 'phone'],
      customer: ['name', 'email', 'phone', 'address', 'location'],
      courier: ['name', 'email', 'phone'],
    }[role];

    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(fields || {})) {
      if (!allowed.includes(key) || value === undefined) continue;
      sets.push(`${key} = ?`);
      values.push(value);
    }
    if (!sets.length) throw Object.assign(new Error('Nothing to update'), { status: 400 });

    values.push(id);
    const [result] = await pool.query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) throw Object.assign(new Error('Account not found'), { status: 404 });

    // On the older layout the email on this row is only a copy; the one used to sign in
    // lives in `users`. Change both, or the account would sign in with the old address.
    if (fields?.email !== undefined) {
      const [link] = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'user_id'`,
        [table],
      );
      if (link.length) {
        await pool.query(`UPDATE users u JOIN ${table} t ON t.user_id = u.id SET u.email = ? WHERE t.id = ?`, [fields.email, id]);
      }
    }
    return { role, id: Number(id), updated: sets.length };
  }
}

export default Admin;
