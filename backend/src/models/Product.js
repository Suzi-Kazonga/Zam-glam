import { pool } from '../config/db.js';

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
  }) {
    const query =
      'INSERT INTO products (seller_id, store_id, category_id, name, description, price, stock, image_url, audience, sizes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

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
    ]);

    return result.insertId;
  }

  // Find product by ID
  static async findById(id) {
    const query = 'SELECT * FROM products WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Get products by store
  static async findByStore(seller_id) {
    const query = 'SELECT * FROM products WHERE seller_id = ?';
    const [rows] = await pool.query(query, [seller_id]);
    return rows;
  }

  // Get filtered products (audience + category)
  static async getFiltered(filters = {}) {
    let query = 'SELECT * FROM products WHERE 1=1';
    const values = [];

    if (filters.store_id) {
      query += ' AND store_id = ?';
      values.push(filters.store_id);
    }

    if (filters.audience) {
      query += ' AND audience = ?';
      values.push(filters.audience);
    }

    if (filters.category_id) {
      query += ' AND category_id = ?';
      values.push(filters.category_id);
    }

    const [rows] = await pool.query(query, values);
    return rows;
  }

  // Update product
  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'store_id') {
        if (key === 'sizes') {
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
