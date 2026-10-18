// Load the team's shared demo database (database/snapshot/zamglam_db.sql) into your MySQL,
// so everyone works with the same shops, products, orders and chats.
//
//   npm run db:import          (from the project folder or backend/)
//
// Every account in it signs in with the shared demo password (123456789), the admin
// included: admin@zamglam.local.
//
// Your current database is copied to zamglam_db_backup_<date-time> first, so nothing is
// lost; that copy can be dropped in phpMyAdmin once you are happy. It is never run on its
// own (not on pull, not on start), because it replaces whatever is in your database.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const here = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = path.resolve(here, '../../database/snapshot/zamglam_db.sql');
const DATABASE = process.env.DB_NAME || 'zamglam_db';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to replace a production database with demo data.');
  process.exit(1);
}

const connection = await mysql
  .createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    multipleStatements: true,
    connectTimeout: 5000,
  })
  .catch((error) => {
    console.error(`Could not reach MySQL (${error.code || error.message}). Start MySQL in XAMPP and try again.`);
    process.exit(1);
  });

const q = (name) => `\`${name.replace(/`/g, '``')}\``;

try {
  const [tables] = await connection.query(
    "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
    [DATABASE],
  );

  // 1. Keep a copy of what is there now.
  if (tables.length) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
    const backup = `${DATABASE}_backup_${stamp}`;
    await connection.query(`CREATE DATABASE ${q(backup)} CHARACTER SET utf8mb4`);
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const { name } of tables) {
      await connection.query(`CREATE TABLE ${q(backup)}.${q(name)} LIKE ${q(DATABASE)}.${q(name)}`);
      await connection.query(`INSERT INTO ${q(backup)}.${q(name)} SELECT * FROM ${q(DATABASE)}.${q(name)}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`Backed up your current database to ${backup} (${tables.length} tables).`);
  }

  // 2. Replace it with the shared copy. Tables the snapshot does not have are dropped too,
  //    so nothing stale is left referring to rows that are gone.
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${q(DATABASE)} CHARACTER SET utf8mb4`);
  await connection.query(`USE ${q(DATABASE)}`);
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const { name } of tables) await connection.query(`DROP TABLE IF EXISTS ${q(name)}`);
  await connection.query(fs.readFileSync(SNAPSHOT, 'utf8'));
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  const counts = {};
  for (const table of ['sellers', 'stores', 'products', 'customers', 'couriers', 'orders']) {
    const [[row]] = await connection.query(`SELECT COUNT(*) AS n FROM ${q(table)}`);
    counts[table] = row.n;
  }
  console.log(`Loaded the demo database into ${DATABASE}:`, counts);
  console.log('Every account signs in with 123456789 — admin: admin@zamglam.local. Restart the backend if it is running.');
} catch (error) {
  console.error('Import failed:', error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
