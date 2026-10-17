import { pool } from '../config/db.js';
import { resolveCustomerId, resolveSellerId, resolveCourierId } from '../utils/accounts.js';

// Problems reported to Zamglam itself.
//
// This is not the same thing as models/Report.js, which is a complaint about another
// party on an order. This is "something in the application is wrong" — a shopper, a shop
// or a courier telling the administrators about it. Every one of them lands in the
// administrators' customer service list and stays there until it is marked done.

const TABLE_FOR = { seller: 'sellers', customer: 'customers', courier: 'couriers' };
const NAME_COLUMN = { seller: 'shop_name', customer: 'name', courier: 'name' };
const RESOLVER_FOR = { seller: resolveSellerId, customer: resolveCustomerId, courier: resolveCourierId };

class ProblemReport {
  // File a problem. The reporter's role and name are copied in at the time of writing, so
  // the list still reads properly if the account is later renamed or removed.
  static async create({ user_id, role, message }) {
    const text = String(message || '').trim();
    if (!text) throw Object.assign(new Error('Describe the problem before sending'), { status: 400 });
    if (text.length > 2000) throw Object.assign(new Error('That is too long — 2000 characters at most'), { status: 400 });

    const resolve = RESOLVER_FOR[role];
    if (!resolve) throw Object.assign(new Error('Only a customer, seller or courier can report a problem'), { status: 403 });

    const reporterId = await resolve(user_id);
    if (!reporterId) throw Object.assign(new Error('Account not found'), { status: 404 });

    const [rows] = await pool.query(
      `SELECT ${NAME_COLUMN[role]} AS name, email FROM ${TABLE_FOR[role]} WHERE id = ?`,
      [reporterId],
    );

    const [result] = await pool.query(
      `INSERT INTO problem_reports (reporter_role, reporter_id, reporter_name, reporter_email, message)
       VALUES (?, ?, ?, ?, ?)`,
      [role, reporterId, rows[0]?.name || 'Unknown', rows[0]?.email || null, text],
    );

    return { id: result.insertId, status: 'open' };
  }

  // Everything an administrator needs to see, newest first. Open ones by default: the
  // list is a queue, not an archive.
  static async list({ status = 'open' } = {}) {
    const where = status === 'all' ? '' : 'WHERE status = ?';
    const [rows] = await pool.query(
      `SELECT id, reporter_role, reporter_id, reporter_name, reporter_email, message,
              status, created_at, resolved_at
       FROM problem_reports ${where}
       ORDER BY created_at DESC, id DESC`,
      status === 'all' ? [] : [status],
    );
    return rows;
  }

  // What the bell on the customer service button counts.
  static async openCount() {
    const [rows] = await pool.query("SELECT COUNT(*) AS count FROM problem_reports WHERE status = 'open'");
    return Number(rows[0]?.count || 0);
  }

  // The reporter's own problems, so they can see what they have already sent.
  static async listMine({ user_id, role }) {
    const resolve = RESOLVER_FOR[role];
    if (!resolve) return [];
    const reporterId = await resolve(user_id);
    if (!reporterId) return [];
    const [rows] = await pool.query(
      `SELECT id, message, status, created_at, resolved_at FROM problem_reports
       WHERE reporter_role = ? AND reporter_id = ? ORDER BY created_at DESC`,
      [role, reporterId],
    );
    return rows;
  }

  // Marking one done takes it out of the count. Doing it twice changes nothing, so a
  // double click cannot make the figures drift.
  static async markDone(id) {
    const [result] = await pool.query(
      "UPDATE problem_reports SET status = 'done', resolved_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'open'",
      [id],
    );
    if (result.affectedRows === 0) {
      const [rows] = await pool.query('SELECT id, status FROM problem_reports WHERE id = ?', [id]);
      if (!rows[0]) throw Object.assign(new Error('That report does not exist'), { status: 404 });
      return { id: Number(id), status: rows[0].status, already: true };
    }
    return { id: Number(id), status: 'done' };
  }

  // Reopening, for a problem marked done too eagerly.
  static async reopen(id) {
    const [result] = await pool.query(
      "UPDATE problem_reports SET status = 'open', resolved_at = NULL WHERE id = ?",
      [id],
    );
    if (result.affectedRows === 0) throw Object.assign(new Error('That report does not exist'), { status: 404 });
    return { id: Number(id), status: 'open' };
  }
}

export default ProblemReport;
