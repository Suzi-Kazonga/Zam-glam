import { pool } from '../config/db.js';
import Product from './Product.js';

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

  // Stores travel with their seller's verification status so shoppers can see whether the
  // shop has been checked.
  static get selectWithSeller() {
    return `SELECT st.*, s.verification_status, s.shop_name
            FROM stores st JOIN sellers s ON s.id = st.seller_id`;
  }

  // Find store by ID
  static async findById(id) {
    const [rows] = await pool.query(`${Store.selectWithSeller} WHERE st.id = ?`, [id]);
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
    const [rows] = await pool.query(`${Store.selectWithSeller} WHERE st.status = 'open' ORDER BY st.id`);
    return rows;
  }

  // Get products for a store with filters. Delegates to Product so storefront products
  // carry store/category names and have their JSON columns parsed — MariaDB returns those
  // as raw strings, which would leave images as a string rather than an array.
  static async getProducts(store_id, filters = {}) {
    return Product.getFiltered({
      store_id,
      audience: filters.audience,
      category_id: filters.category,
    });
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
