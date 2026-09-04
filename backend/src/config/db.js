import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zamglam_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  connectTimeout: 5000,
};

const pool = mysql.createPool(config);

export async function initializeDatabase() {
  try {
    let adminConnection;
    let lastError;
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      try {
        adminConnection = await mysql.createConnection({
          host: config.host,
          user: config.user,
          password: config.password,
        });
        break;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    if (!adminConnection) throw lastError;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','customer','seller') NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      address VARCHAR(255),
      phone VARCHAR(50),
      city VARCHAR(100),
      location VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sellers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      shop_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Admins review vendor verification, so a real admin account has to be able to exist —
  // previously 'admin' fell through User.create and created a customer row instead.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NULL UNIQUE,
      password VARCHAR(255) NULL,
      role_level VARCHAR(30) NOT NULL DEFAULT 'manager',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS couriers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NULL UNIQUE,
      password VARCHAR(255) NULL,
      phone VARCHAR(50),
      vehicle VARCHAR(100),
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seller_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      logo_url VARCHAR(500),
      location VARCHAR(255),
      open_hours JSON,
      status VARCHAR(20) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_stores_seller (seller_id),
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seller_id INT NOT NULL,
      store_id INT,
      category_id INT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      stock INT DEFAULT 0,
      image_url VARCHAR(500),
      audience VARCHAR(50) DEFAULT 'unisex',
      sizes JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_cart_customer_product (customer_id, product_id),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
      status VARCHAR(50) DEFAULT 'placed',
      address VARCHAR(255),
      location VARCHAR(150),
      phone VARCHAR(30),
      payment_method VARCHAR(30),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // A multi-vendor order is fulfilled as one parcel PER STORE: each store packs, hands over
  // and is delivered independently, with its own courier. orders.status is a rollup of these.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      seller_id INT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'placed',
      courier_id INT NULL,
      driver_name VARCHAR(255),
      driver_phone VARCHAR(50),
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      distance VARCHAR(100),
      direction VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_shipment_order_seller (order_id, seller_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      status VARCHAR(50) NOT NULL,
      note VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      method VARCHAR(30) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      status VARCHAR(30) DEFAULT 'pending',
      transaction_ref VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS courier (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL UNIQUE,
      driver_name VARCHAR(255) NOT NULL,
      driver_phone VARCHAR(50),
      price DECIMAL(10,2) NOT NULL,
      distance VARCHAR(100),
      direction VARCHAR(255),
      status VARCHAR(30) DEFAULT 'assigned',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      url VARCHAR(500) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrations for pre-existing local databases created before the columns/tables above
  // existed. CREATE TABLE IF NOT EXISTS is a no-op on an existing table, so older
  // installs need these applied explicitly.
  const columnInfo = async (table, column) => {
    const [rows] = await pool.query(
      `SELECT IS_NULLABLE, COLUMN_TYPE FROM information_schema.columns
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column],
    );
    return rows[0] || null;
  };

  const addColumnIfMissing = async (table, column, definition) => {
    if (!(await columnInfo(table, column))) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };

  await addColumnIfMissing('orders', 'total_price', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
  // total_price is the grand total; these break it down for the receipt.
  await addColumnIfMissing('orders', 'items_total', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
  await addColumnIfMissing('orders', 'delivery_total', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
  // Orders placed before delivery was billed were charged for items only. Record that
  // honestly rather than leaving items_total at 0 and showing a broken receipt.
  await pool.query('UPDATE orders SET items_total = total_price WHERE items_total = 0 AND total_price > 0');
  await addColumnIfMissing('orders', 'address', 'VARCHAR(255)');
  await addColumnIfMissing('orders', 'location', 'VARCHAR(150)');
  await addColumnIfMissing('orders', 'phone', 'VARCHAR(30)');
  await addColumnIfMissing('orders', 'payment_method', 'VARCHAR(30)');
  await addColumnIfMissing('courier', 'status', "VARCHAR(30) DEFAULT 'assigned'");
  await addColumnIfMissing('courier', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await addColumnIfMissing('courier', 'driver_phone', 'VARCHAR(50)');
  await addColumnIfMissing('courier', 'courier_id', 'INT NULL');
  await addColumnIfMissing('customers', 'location', 'VARCHAR(150)');

  // Vendor verification: sellers submit ID/licence documents and an admin approves them,
  // so shoppers can tell a checked shop from an unchecked one.
  await addColumnIfMissing('sellers', 'verification_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
  await addColumnIfMissing('sellers', 'verified_at', 'TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing('documents', 'seller_id', 'INT NULL');
  await addColumnIfMissing('documents', 'doc_number', 'VARCHAR(100)');
  await addColumnIfMissing('documents', 'review_note', 'VARCHAR(255)');
  // documents.user_id is foreign-keyed to users, but sellers keep their own logins in this
  // schema shape, so a seller id is not a users id. Documents are keyed by seller_id
  // instead; user_id has to be nullable for that to be insertable at all.
  const userIdColumn = await columnInfo('documents', 'user_id');
  if (userIdColumn && userIdColumn.IS_NULLABLE === 'NO') {
    await pool.query(`ALTER TABLE documents MODIFY COLUMN user_id ${userIdColumn.COLUMN_TYPE} NULL`);
  }
  // Products carry a gallery; image_url stays as the primary/thumbnail image.
  await addColumnIfMissing('products', 'images', 'JSON');
  // Tracking events belong to a specific parcel; NULL means an order-wide event.
  await addColumnIfMissing('order_status_history', 'shipment_id', 'INT NULL');

  // Backfill parcels for orders created before per-store shipments existed, so old
  // multi-store orders become actionable instead of sharing one stuck status.
  const [legacyOrders] = await pool.query(
    `SELECT o.id, o.status, o.address, o.location FROM orders o
     WHERE NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id)`,
  );
  for (const order of legacyOrders) {
    const [sellers] = await pool.query(
      `SELECT DISTINCT p.seller_id FROM order_items oi JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [order.id],
    );
    const [existingCourier] = await pool.query('SELECT * FROM courier WHERE order_id = ? LIMIT 1', [order.id]);
    for (const { seller_id } of sellers) {
      const courier = existingCourier[0] || {};
      await pool.query(
        `INSERT IGNORE INTO shipments
           (order_id, seller_id, status, courier_id, driver_name, driver_phone, price, distance, direction)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          seller_id,
          order.status || 'placed',
          courier.courier_id || null,
          courier.driver_name || null,
          courier.driver_phone || null,
          courier.price || 0,
          courier.distance || null,
          courier.direction || null,
        ],
      );
    }
    if (sellers.length) console.log(`↺ Backfilled ${sellers.length} parcel(s) for order #${order.id}`);
  }

  // Older installs stored one product per order directly on the orders row. Line items now
  // live in order_items, so these legacy columns must stop being required for an insert.
  for (const column of ['product_id', 'quantity']) {
    const info = await columnInfo('orders', column);
    if (info && info.IS_NULLABLE === 'NO') {
      await pool.query(`ALTER TABLE orders MODIFY COLUMN ${column} ${info.COLUMN_TYPE} NULL`);
    }
  }

  await pool.query(`
    INSERT INTO categories (name, description)
    SELECT 'General', 'Zamglam products'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'General')
  `);

    return pool;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
}

export async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    console.log('✅ Database connected successfully');
    return rows[0];
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

export { pool };
