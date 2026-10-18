// The demonstration accounts, and keeping them usable on every copy of the project.
//
// Every demo account shares one password, so a marker or a teammate needs to remember only
// this. The catch is that data does not travel with code: a teammate who pulls the latest
// version still has whatever passwords their own database was seeded with, and may have
// no administrator at all. They then cannot sign in with the documented password, and
// nothing tells them why.
//
// So this runs when the server starts, outside production: it puts the demo accounts back
// on the shared password and makes sure an administrator exists. Pulling and restarting
// is enough. Only the demo addresses are touched — an account somebody registered for
// themselves is never changed.

import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import User from '../models/User.js';

// Set DEMO_PASSWORD in the environment to use something else.
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || '123456789';

export const DEMO_ADMIN_EMAIL = 'admin@zamglam.local';

export const DEMO_EMAILS = [
  DEMO_ADMIN_EMAIL, 'customer@zamglam.local',
  'mud@zamglam.local', 'jets@zamglam.local', 'bata@zamglam.local',
  'pep@zamglam.local', 'mrprice@zamglam.local', 'fashionsgalore@zamglam.local',
  'mwansa@zamglamcourier.local', 'thandiwe@zamglamcourier.local', 'joseph@zamglamcourier.local',
];

async function tableHas(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.columns
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.count || 0) > 0;
}

// Put every existing demo account back on the shared password. Returns how many changed.
//
// Which table holds the login depends on the account layout, so the password is written
// wherever that email is actually stored — the account's own row, or the older central
// users table.
export async function resetDemoPasswords() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const tables = [];
  for (const table of ['users', 'customers', 'sellers', 'couriers', 'admins']) {
    if (await tableHas(table, 'password') && await tableHas(table, 'email')) tables.push(table);
  }

  let changed = 0;
  for (const email of DEMO_EMAILS) {
    const account = await User.findByEmail(email);
    if (!account) continue;
    if (await bcrypt.compare(DEMO_PASSWORD, account.password_hash || '')) continue;
    for (const table of tables) {
      await pool.query(`UPDATE ${table} SET password = ? WHERE LOWER(email) = ?`, [hash, email]);
    }
    changed += 1;
  }
  return changed;
}

// Without an administrator nobody can approve a shop or a rider, so a database that has
// none gets the demo one.
export async function ensureDemoAdmin() {
  if (await User.findByEmail(DEMO_ADMIN_EMAIL)) return false;
  await User.create({ name: 'Zamglam Admin', email: DEMO_ADMIN_EMAIL, password: DEMO_PASSWORD, role: 'admin' });
  return true;
}

// Both, for the server to call on startup. Says what it did, so a teammate can see it.
export async function prepareDemoAccounts() {
  const createdAdmin = await ensureDemoAdmin();
  const reset = await resetDemoPasswords();
  if (createdAdmin) console.log(`👤 No administrator found — created ${DEMO_ADMIN_EMAIL}`);
  if (reset) console.log(`🔑 ${reset} demo account(s) put back on the shared demo password`);
  return { createdAdmin, reset };
}
