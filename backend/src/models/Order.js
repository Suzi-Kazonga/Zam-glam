import { pool } from '../config/db.js';

class Order {
  // Create a new order
  static async create({ user_id, customer_id, store_id, total_amount, shipping_address }) {
    const query =
      'INSERT INTO orders (user_id, customer_id, store_id, total_amount, shipping_address) VALUES (?, ?, ?, ?, ?)';

    const [result] = await pool.query(query, [
      user_id,
      customer_id,
      store_id,
      total_amount,
      shipping_address,
    ]);

    return result.insertId;
  }

  // Add item to order
  static async addItem({ order_id, product_id, quantity, price }) {
    const query =
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';

    const [result] = await pool.query(query, [order_id, product_id, quantity, price]);

    return result.insertId;
  }

  // Find order by ID
  static async findById(id) {
    const query = 'SELECT * FROM orders WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Get orders by user
  static async findByUser(user_id) {
    const query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
    const [rows] = await pool.query(query, [user_id]);
    return rows;
  }

  // Get orders by store
  static async findByStore(store_id) {
    const query = 'SELECT * FROM orders WHERE store_id = ? ORDER BY created_at DESC';
    const [rows] = await pool.query(query, [store_id]);
    return rows;
  }

  // Get order items
  static async getItems(order_id) {
    const query =
      'SELECT oi.*, p.name, p.image_url FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?';
    const [rows] = await pool.query(query, [order_id]);
    return rows;
  }

  // Update order status
  static async updateStatus(id, status) {
    const query = 'UPDATE orders SET status = ? WHERE id = ?';
    const [result] = await pool.query(query, [status, id]);
    return result.affectedRows > 0;
  }
}

export default Order;
