import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST || '127.0.0.1',   // force TCP/IP on Windows/XAMPP
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zamglam_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(config);

async function ensureCustomerProfileColumns() {
  const columnDefinitions = [
    ['city', 'VARCHAR(120) NULL'],
    ['country', 'VARCHAR(120) NOT NULL DEFAULT "Zambia"'],
    ['preferred_currency', 'VARCHAR(10) NOT NULL DEFAULT "ZMW"'],
    ['newsletter_opt_in', 'BOOLEAN NOT NULL DEFAULT TRUE'],
    ['marketing_opt_in', 'BOOLEAN NOT NULL DEFAULT FALSE'],
    ['is_active', 'BOOLEAN NOT NULL DEFAULT TRUE'],
    ['created_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'],
    ['updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
  ];

  for (const [columnName, definition] of columnDefinitions) {
    try {
      await pool.query(`ALTER TABLE customers ADD COLUMN ${columnName} ${definition}`);
    } catch (error) {
      const message = String(error?.message || '');
      if (!message.includes('Duplicate column name') && !message.includes('already exists')) {
        throw error;
      }
    }
  }
}

export async function initializeDatabase() {
  // Connect without database first to ensure DB exists
  const adminConnection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });

  await adminConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`
  );
  await adminConnection.end();

  // Now use pool to create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      address VARCHAR(255),
      phone VARCHAR(50),
      city VARCHAR(120),
      country VARCHAR(120) DEFAULT 'Zambia',
      preferred_currency VARCHAR(10) DEFAULT 'ZMW',
      newsletter_opt_in BOOLEAN DEFAULT TRUE,
      marketing_opt_in BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await ensureCustomerProfileColumns();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sellers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      shop_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seller_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      stock INT DEFAULT 0,
      image_url VARCHAR(500),
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS courier (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      driver_name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      distance VARCHAR(100),
      direction VARCHAR(255),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  return pool;
}

export async function testConnection() {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows[0];
}

export { pool };
