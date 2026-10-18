// Put the demo accounts back on the shared password, without starting the server.
//
// Runs on its own after every git pull or merge (see .githooks), and by hand with
//   npm run fix-logins
// so the documented demo password works the moment new code arrives — not only once
// somebody remembers to restart the backend or re-seed.
//
// It must never get in the way of a pull: if MySQL is not running, or the packages are
// not installed yet, it says so and stops quietly, and the server's own startup repair
// catches up later.

import { initializeDatabase, pool } from '../src/config/db.js';
import { prepareDemoAccounts, DEMO_PASSWORD } from '../src/utils/demoAccounts.js';

if (process.env.NODE_ENV === 'production' || process.env.DEMO_ACCOUNTS === 'off') {
  console.log('Demo accounts: left alone (production, or DEMO_ACCOUNTS=off).');
  process.exit(0);
}

// One quick knock before anything else. The schema setup retries MySQL for over a
// minute, which is right for a server starting up and wrong for a git pull.
async function mysqlIsUp() {
  const mysql = (await import('mysql2/promise')).default;
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
      connectTimeout: 2000,
    });
    await connection.end();
    return true;
  } catch {
    return false;
  }
}

if (!(await mysqlIsUp())) {
  console.log('Demo accounts: MySQL is not running, so they were not checked. Start MySQL; the backend fixes them when it starts.');
  await pool.end().catch(() => {});
  process.exit(0);
}

try {
  // Brings the schema up to date first, so new columns exist before anything reads them.
  await initializeDatabase();
  const { createdAdmin, reset } = await prepareDemoAccounts();
  if (!createdAdmin && !reset) console.log(`Demo accounts: already on the shared password (${DEMO_PASSWORD}).`);
  else console.log(`Demo accounts: ready — sign in with the shared password (${DEMO_PASSWORD}).`);
} catch (error) {
  const unreachable = ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(error.code);
  console.log(unreachable
    ? 'Demo accounts: MySQL is not running, so they were not checked. Start MySQL; the backend fixes them when it starts.'
    : `Demo accounts: not checked (${error.message}). The backend fixes them when it starts.`);
} finally {
  await pool.end().catch(() => {});
}
process.exit(0);
