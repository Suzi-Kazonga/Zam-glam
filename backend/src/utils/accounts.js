import { pool } from '../config/db.js';

// Two account schemas exist in the wild: either a central `users` table that
// customers/sellers/couriers link to via user_id, or those rows holding the login
// directly. req.user.id therefore means users.id in the first shape and
// customers.id / sellers.id / couriers.id in the second.
//
// Every lookup that turns req.user.id into a profile id must go through here — doing
// it inline is what left product creation broken with "Unknown column 'user_id'".
export async function hasColumn(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.columns
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.count || 0) > 0;
}

// Turn a signed-in user into their profile id in one of the account tables.
//
// On the older layout the row is found by its link to the central users table; on the
// current one the id already IS the profile id, and the second query confirms it exists.
async function resolveProfileId(table, user_id) {
  if (await hasColumn(table, 'user_id')) {
    const [linked] = await pool.query(`SELECT id FROM ${table} WHERE user_id = ?`, [user_id]);
    if (linked[0]) return linked[0].id;

    // The column exists but is empty on this row. `couriers` is built with a nullable
    // user_id even on the current layout, where the rider holds their own login and the
    // id already IS the profile id — so a courier would resolve to nothing at all, and
    // going on duty would answer "courier profile not found".
    //
    // Only rows with no link are considered, so this can never hand back somebody else's
    // profile because a users.id happened to match an unrelated row's id.
    const [unlinked] = await pool.query(`SELECT id FROM ${table} WHERE id = ? AND user_id IS NULL`, [user_id]);
    return unlinked[0]?.id || null;
  }
  const [rows] = await pool.query(`SELECT id FROM ${table} WHERE id = ?`, [user_id]);
  return rows[0]?.id || null;
}

export function sameDatabaseId(left, right) {
  const leftId = Number(left);
  const rightId = Number(right);
  return Number.isSafeInteger(leftId) && leftId > 0 && leftId === rightId;
}

// The three the rest of the code actually calls.
export const resolveSellerId = (user_id) => resolveProfileId('sellers', user_id);
export const resolveCustomerId = (user_id) => resolveProfileId('customers', user_id);
export const resolveCourierId = (user_id) => resolveProfileId('couriers', user_id);

// A seller's products belong to their store; the store is implied by the seller, so
// the client never has to send store_id.
export async function resolveStoreIdForSeller(seller_id) {
  const [rows] = await pool.query('SELECT id FROM stores WHERE seller_id = ? LIMIT 1', [seller_id]);
  return rows[0]?.id || null;
}

// The product form sends a category name ("clothes"/"shoes"), while products.category_id
// is a foreign key. Look the name up case-insensitively, creating it when new.
export async function resolveCategoryId(name) {
  const categoryName = String(name || 'General').trim() || 'General';
  const [existing] = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1', [categoryName]);
  if (existing[0]) return existing[0].id;
  const [created] = await pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', [
    categoryName,
    `${categoryName} products`,
  ]);
  return created.insertId;
}
