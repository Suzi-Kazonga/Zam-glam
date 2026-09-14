import { pool } from '../config/db.js';

// On MariaDB, JSON is an alias for LONGTEXT, so the driver hands these columns back as
// raw strings rather than parsed values. Always return real arrays to the API, or callers
// end up doing images[0] on a string and getting "[".
function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalize(row) {
  if (!row) return row;
  return { ...row, sizes: parseJsonArray(row.sizes), images: parseJsonArray(row.images) };
}

class Product {
  // Create a new product
  static async create({
    seller_id,
    store_id,
    category_id,
    name,
    description,
    price,
    stock,
    image_url,
    audience,
    sizes,
    images,
  }) {
    const query =
      'INSERT INTO products (seller_id, store_id, category_id, name, description, price, stock, image_url, audience, sizes, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    const [result] = await pool.query(query, [
      seller_id,
      store_id,
      category_id,
      name,
      description,
      price,
      stock,
      image_url,
      audience,
      JSON.stringify(sizes || []),
      JSON.stringify(images || []),
    ]);

    return result.insertId;
  }

  // Find product by ID
  // Products always travel with their shop's name — the storefront labels every card with
  // it, and the home banner credits the store whose item it is showing.
  static get selectWithStore() {
    return `SELECT p.*, s.name AS store_name, c.name AS category_name,
                   sel.verification_status AS store_verification,
                   sel.id AS store_seller_id,
                   COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.seller_id = sel.id), 1), 0) AS store_rating,
                   (SELECT COUNT(*) FROM reviews r WHERE r.seller_id = sel.id) AS store_rating_count
            FROM products p
            LEFT JOIN stores s ON s.id = p.store_id
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN sellers sel ON sel.id = p.seller_id`;
  }

  static async findById(id) {
    const [rows] = await pool.query(`${Product.selectWithStore} WHERE p.id = ?`, [id]);
    return normalize(rows[0]);
  }

  // Get products by store
  static async findByStore(seller_id) {
    const [rows] = await pool.query(`${Product.selectWithStore} WHERE p.seller_id = ?`, [seller_id]);
    return rows.map(normalize);
  }

  // Get filtered products (audience + category)
  static async getFiltered(filters = {}) {
    // A deleted shop's products leave the catalogue while it is in the grace period.
    let query = `${Product.selectWithStore} WHERE sel.deleted_at IS NULL`;
    const values = [];

    if (filters.store_id) {
      query += ' AND p.store_id = ?';
      values.push(filters.store_id);
    }

    if (filters.audience) {
      query += ' AND p.audience = ?';
      values.push(filters.audience);
    }

    if (filters.category_id) {
      query += ' AND p.category_id = ?';
      values.push(filters.category_id);
    }

    const [rows] = await pool.query(query, values);
    return rows.map(normalize);
  }

  // Update product. Only real columns may be written: the seller form also sends helper
  // fields (sellerEmail, store_name, category, …) which would otherwise land in the SQL
  // and fail with "Unknown column".
  static async update(id, data) {
    const updatable = ['category_id', 'name', 'description', 'price', 'stock', 'image_url', 'audience', 'sizes', 'images'];
    const fields = [];
    const values = [];

    Object.entries(data).forEach(([key, value]) => {
      if (!updatable.includes(key) || value === undefined) return;
      fields.push(`${key} = ?`);
      values.push(key === 'sizes' || key === 'images' ? JSON.stringify(value ?? []) : value);
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(query, values);

    return result.affectedRows > 0;
  }

  // Delete product
  static async delete(id) {
    const query = 'DELETE FROM products WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  }
}

export default Product;
