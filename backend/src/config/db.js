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

    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
    await adminConnection.end();

    // Create categories table first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sellers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        shop_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
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
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
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
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        delivery_address VARCHAR(500),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS courier (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        driver_name VARCHAR(255),
        driver_phone VARCHAR(50),
        price DECIMAL(10,2) NOT NULL,
        distance VARCHAR(100),
        direction VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    // Insert default category
    await pool.query(`
      INSERT IGNORE INTO categories (name, description)
      VALUES ('General', 'Zamglam products');
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
