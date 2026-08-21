import { pool } from '../config/db.js';

class Store {
  // Create a new store
  static async create({ seller_id, name, description, logo_url, location, open_hours }) {
    const query =
      'INSERT INTO stores (seller_id, name, description, logo_url, location, open_hours) VALUES (?, ?, ?, ?, ?, ?)';

    const [result] = await pool.query(query, [
      seller_id,
      name,
      description,
      logo_url,
      location,
      JSON.stringify(open_hours || {}),
    ]);

    return result.insertId;
  }

  // Find store by ID
  static async findById(id) {
    const query = 'SELECT * FROM stores WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Find store by seller ID
  static async findBySellerId(seller_id) {
    const query = 'SELECT * FROM stores WHERE seller_id = ?';
    const [rows] = await pool.query(query, [seller_id]);
    return rows[0];
  }

  // Get all stores
  static async getAll() {
    const query = 'SELECT * FROM stores WHERE status = "open" ORDER BY id';
    const [rows] = await pool.query(query);
    return rows;
  }

  // Get products for a store with filters
  static async getProducts(store_id, filters = {}) {
    let query = `SELECT p.*, c.name AS category_name
      FROM products p JOIN categories c ON c.id = p.category_id WHERE p.store_id = ?`;
    const values = [store_id];

    if (filters.audience) {
      query += ' AND audience = ?';
      values.push(filters.audience);
    }

    if (filters.category) {
      query += ' AND p.category_id = ?';
      values.push(filters.category);
    }

    const [rows] = await pool.query(query, values);
    return rows;
  }

  // Update store
  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'seller_id') {
        if (key === 'open_hours') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE stores SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(query, values);

    return result.affectedRows > 0;
  }
}

export default Store;
