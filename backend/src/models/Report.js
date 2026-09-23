import { pool } from '../config/db.js';
import { resolveCustomerId, resolveSellerId, resolveCourierId } from '../utils/accounts.js';

// Three separate complaints against the same party raise it to an admin.
export const REPORT_THRESHOLD = 3;

const TABLE_FOR = { seller: 'sellers', customer: 'customers', courier: 'couriers' };
const NAME_COLUMN = { seller: 'shop_name', customer: 'name', courier: 'name' };

export const RESOLVER_FOR = {
  seller: resolveSellerId,
  customer: resolveCustomerId,
  courier: resolveCourierId,
};

class Report {
  // Who was actually involved in this order, so a complaint can only be filed against
  // someone the reporter genuinely dealt with — not an arbitrary account.
  static async partiesOnOrder(orderId) {
    const [rows] = await pool.query(
      `SELECT o.customer_id,
              sh.seller_id, sh.courier_id,
              s.shop_name, c.name AS courier_name, cu.name AS customer_name
       FROM orders o
       LEFT JOIN shipments sh ON sh.order_id = o.id
       LEFT JOIN sellers s ON s.id = sh.seller_id
       LEFT JOIN couriers c ON c.id = sh.courier_id
       LEFT JOIN customers cu ON cu.id = o.customer_id
       WHERE o.id = ?`,
      [orderId],
    );
    if (!rows.length) return null;

    return {
      customer: { id: rows[0].customer_id, name: rows[0].customer_name },
      sellers: [...new Map(rows.filter((r) => r.seller_id).map((r) => [r.seller_id, { id: r.seller_id, name: r.shop_name }])).values()],
      couriers: [...new Map(rows.filter((r) => r.courier_id).map((r) => [r.courier_id, { id: r.courier_id, name: r.courier_name }])).values()],
    };
  }

  static async create({ user_id, reporter_role, order_id, reported_role, reported_id, reason, details }) {
    if (!TABLE_FOR[reported_role]) {
      throw Object.assign(new Error('reported_role must be seller, customer or courier'), { status: 400 });
    }
    if (!reason?.trim()) throw Object.assign(new Error('A reason is required'), { status: 400 });

    const reporterId = await RESOLVER_FOR[reporter_role]?.(user_id);
    if (!reporterId) throw Object.assign(new Error('Your account could not be resolved'), { status: 404 });

    if (reporter_role === reported_role && Number(reporterId) === Number(reported_id)) {
      throw Object.assign(new Error('You cannot report yourself'), { status: 400 });
    }

    // Both sides must have been on the order.
    const parties = await Report.partiesOnOrder(order_id);
    if (!parties) throw Object.assign(new Error('Order not found'), { status: 404 });

    const involved = (role, id) => {
      if (role === 'customer') return Number(parties.customer.id) === Number(id);
      if (role === 'seller') return parties.sellers.some((s) => Number(s.id) === Number(id));
      return parties.couriers.some((c) => Number(c.id) === Number(id));
    };

    if (!involved(reporter_role, reporterId)) {
      throw Object.assign(new Error('You were not part of this order'), { status: 403 });
    }
    if (!involved(reported_role, reported_id)) {
      throw Object.assign(new Error('That party was not part of this order'), { status: 400 });
    }

    try {
      await pool.query(
        `INSERT INTO reports (order_id, reporter_role, reporter_id, reported_role, reported_id, reason, details)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [order_id, reporter_role, reporterId, reported_role, reported_id, reason.trim(), details?.trim() || null],
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw Object.assign(new Error('You have already reported this party for this order'), { status: 409 });
      }
      throw error;
    }

    const count = await Report.countAgainst(reported_role, reported_id);
    return { reported_role, reported_id, reports: count, flagged: count >= REPORT_THRESHOLD };
  }

  static async countAgainst(role, id) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) n FROM reports WHERE reported_role = ? AND reported_id = ? AND status = 'open'",
      [role, id],
    );
    return Number(rows[0]?.n || 0);
  }

  // Parties grouped by how many open complaints they have, worst first. Anything at or
  // above the threshold is what the admin is being asked to look at.
  static async summary() {
    const [rows] = await pool.query(
      `SELECT r.reported_role, r.reported_id, COUNT(*) AS report_count,
              MAX(r.created_at) AS latest,
              GROUP_CONCAT(DISTINCT r.reason ORDER BY r.created_at DESC SEPARATOR ' | ') AS reasons
       FROM reports r
       WHERE r.status = 'open'
       GROUP BY r.reported_role, r.reported_id
       ORDER BY report_count DESC, latest DESC`,
    );

    // Attach each party's name and current standing.
    const enriched = [];
    for (const row of rows) {
      const table = TABLE_FOR[row.reported_role];
      if (!table) continue;
      const [who] = await pool.query(
        `SELECT ${NAME_COLUMN[row.reported_role]} AS name, email, account_status, suspension_reason
         FROM ${table} WHERE id = ?`,
        [row.reported_id],
      );
      enriched.push({
        ...row,
        report_count: Number(row.report_count),
        flagged: Number(row.report_count) >= REPORT_THRESHOLD,
        name: who[0]?.name || 'Unknown',
        email: who[0]?.email || null,
        account_status: who[0]?.account_status || 'active',
        suspension_reason: who[0]?.suspension_reason || null,
      });
    }
    return enriched;
  }

  static async listAgainst(role, id) {
    const [rows] = await pool.query(
      `SELECT id, order_id, reporter_role, reason, details, status, created_at
       FROM reports WHERE reported_role = ? AND reported_id = ? ORDER BY created_at DESC`,
      [role, id],
    );
    return rows;
  }

  // Suspending or reinstating an account. Clearing the complaints on reinstatement stops
  // an old grudge immediately re-flagging someone the admin has just cleared.
  static async setAccountStatus({ role, id, status, reason }) {
    const table = TABLE_FOR[role];
    if (!table) throw Object.assign(new Error('Unknown account type'), { status: 400 });
    if (!['active', 'suspended'].includes(status)) {
      throw Object.assign(new Error('status must be active or suspended'), { status: 400 });
    }

    const [result] = await pool.query(
      `UPDATE ${table}
       SET account_status = ?,
           suspended_at = ${status === 'suspended' ? 'CURRENT_TIMESTAMP' : 'NULL'},
           suspension_reason = ?
       WHERE id = ?`,
      [status, status === 'suspended' ? (reason?.trim() || 'Repeated complaints') : null, id],
    );
    if (result.affectedRows === 0) throw Object.assign(new Error('Account not found'), { status: 404 });

    if (status === 'suspended') {
      // A suspended courier should not stay on duty holding the pool open.
      if (role === 'courier') await pool.query('UPDATE couriers SET on_shift = 0 WHERE id = ?', [id]);
      await pool.query(
        "UPDATE reports SET status = 'actioned' WHERE reported_role = ? AND reported_id = ? AND status = 'open'",
        [role, id],
      );
    } else {
      await pool.query(
        "UPDATE reports SET status = 'dismissed' WHERE reported_role = ? AND reported_id = ? AND status = 'open'",
        [role, id],
      );
    }

    return { role, id: Number(id), status };
  }

  // The banner a suspended user sees when they sign in.
  static async statusFor(role, user_id) {
    const table = TABLE_FOR[role];
    if (!table) return null;
    const id = await RESOLVER_FOR[role]?.(user_id);
    if (!id) return null;
    const [rows] = await pool.query(
      `SELECT account_status, suspended_at, suspension_reason FROM ${table} WHERE id = ?`,
      [id],
    );
    if (!rows[0]) return null;
    return {
      suspended: rows[0].account_status === 'suspended',
      suspended_at: rows[0].suspended_at,
      reason: rows[0].suspension_reason,
    };
  }
}

export default Report;
