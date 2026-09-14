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

    // The admin connection exists precisely so the schema can be created on a machine
    // that has never run Zamglam before. Without this a fresh clone fails on the first
    // query with "Unknown database", and the connection itself would leak.
    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    await adminConnection.end();

  // The users table is kept for databases created by earlier versions, where it held the
  // login for every role and customers/sellers linked to it by user_id. New databases put
  // the login on the account itself (see below): every query written since — the admin
  // console, the complaints queue, the verification list — reads s.email straight off the
  // shop, and on the old layout those columns do not exist. src/utils/accounts.js keeps
  // both layouts working.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','customer','seller','courier') NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      address VARCHAR(255),
      phone VARCHAR(50),
      city VARCHAR(100),
      location VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sellers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      shop_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

  // Seller ratings left by customers after a delivery. Ratings were previously kept in the
  // rater's own browser, so nobody else could see them — the trust signal was decorative.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seller_id INT NOT NULL,
      customer_id INT NOT NULL,
      order_id INT NULL,
      rating TINYINT NOT NULL,
      comment TEXT,
      reply TEXT NULL,
      replied_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_review_customer_order_seller (customer_id, order_id, seller_id)
    );
  `);

  // Complaints one party raises against another on a specific order. Three separate
  // reports against the same party raise a flag for an admin to look at.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NULL,
      reporter_role VARCHAR(20) NOT NULL,
      reporter_id INT NOT NULL,
      reported_role VARCHAR(20) NOT NULL,
      reported_id INT NOT NULL,
      reason VARCHAR(80) NOT NULL,
      details TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_report_once (order_id, reporter_role, reporter_id, reported_role, reported_id)
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

  // When the shop released the parcel — the clock that decides how long it has been
  // waiting for a courier, and when it should be escalated.
  await addColumnIfMissing('shipments', 'released_at', 'TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing('shipments', 'escalated_at', 'TIMESTAMP NULL DEFAULT NULL');
  // Couriers came later than the users table, whose role column did not list them: on a
  // database created before that, a courier sign-up would be stored with no role at all.
  await pool.query("ALTER TABLE users MODIFY role ENUM('admin','customer','seller','courier') NOT NULL DEFAULT 'customer'");

  // Couriers go on and off duty; only on-duty couriers see the pool or receive escalations.
  await addColumnIfMissing('couriers', 'on_shift', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addColumnIfMissing('couriers', 'shift_changed_at', 'TIMESTAMP NULL DEFAULT NULL');
  // Couriers carry other people's parcels, so a new sign-up waits for an admin to
  // approve it before it can be given work.
  await addColumnIfMissing('couriers', 'approval_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
  await addColumnIfMissing('couriers', 'approved_at', 'TIMESTAMP NULL DEFAULT NULL');
  // Couriers that predate this column were already working; treat them as approved. A new
  // sign-up is stored inactive, so this can never quietly let an unreviewed rider through.
  await pool.query("UPDATE couriers SET approval_status = 'approved', approved_at = CURRENT_TIMESTAMP WHERE approval_status = 'pending' AND is_active = 1 AND created_at < (CURRENT_TIMESTAMP - INTERVAL 1 MINUTE)");
  // Parcels released before released_at existed: fall back to the order's own timestamp so
  // their age is roughly right rather than null.
  await pool.query(`
    UPDATE shipments s JOIN orders o ON o.id = s.order_id
    SET s.released_at = o.created_at
    WHERE s.released_at IS NULL AND s.status IN ('shipped', 'picked_up', 'delivered')
  `);

  // No courier exists until someone picks the parcel up, so the driver columns must accept
  // NULL — they were written NOT NULL back when a courier was assigned at checkout.
  for (const column of ['driver_name', 'price']) {
    const info = await columnInfo('courier', column);
    if (info && info.IS_NULLABLE === 'NO') {
      await pool.query(`ALTER TABLE courier MODIFY COLUMN ${column} ${info.COLUMN_TYPE} NULL`);
    }
  }

  // Couriers used to be assigned at checkout; parcels are now claimed on pickup. A legacy
  // parcel that is 'shipped' and already has a courier was, in the new model, picked up.
  await pool.query("UPDATE shipments SET status = 'picked_up' WHERE status = 'shipped' AND courier_id IS NOT NULL");
  await pool.query(`
    UPDATE orders o SET o.status = 'picked_up'
    WHERE o.status = 'shipped'
      AND NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status <> 'picked_up' AND s.status <> 'delivered')
  `);
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
  // The admin console shows when each account joined; sellers had no such column.
  await addColumnIfMissing('sellers', 'created_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');

  // Suspension is separate from verification and approval: a checked, approved account
  // can still be suspended for conduct.
  for (const table of ['sellers', 'customers', 'couriers']) {
    await addColumnIfMissing(table, 'account_status', "VARCHAR(20) NOT NULL DEFAULT 'active'");
    await addColumnIfMissing(table, 'suspended_at', 'TIMESTAMP NULL DEFAULT NULL');
    await addColumnIfMissing(table, 'suspension_reason', 'VARCHAR(255)');
    // Deleting an account is reversible for 30 days: the row stays, greyed out in the
    // admin console, and is only removed for good once the grace period passes.
    await addColumnIfMissing(table, 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
  }
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
