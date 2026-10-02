import { pool } from '../config/db.js';

class StoreMessage {
  static async customerThreads(customerId) {
    const [rows] = await pool.query(
      `SELECT store.id AS store_id, store.name AS store_name, store.logo_url,
        (SELECT message.body FROM store_messages message
         WHERE message.store_id = store.id AND message.customer_id = ?
         ORDER BY message.id DESC LIMIT 1) AS last_message,
        (SELECT message.sender_role FROM store_messages message
         WHERE message.store_id = store.id AND message.customer_id = ?
         ORDER BY message.id DESC LIMIT 1) AS last_sender_role,
        (SELECT message.created_at FROM store_messages message
         WHERE message.store_id = store.id AND message.customer_id = ?
         ORDER BY message.id DESC LIMIT 1) AS updated_at
       FROM stores store
       WHERE EXISTS (
         SELECT 1 FROM store_messages message
         WHERE message.store_id = store.id AND message.customer_id = ?
       )
       ORDER BY updated_at DESC`,
      [customerId, customerId, customerId, customerId],
    );
    return rows;
  }

  static async sellerThreads(sellerId) {
    const [rows] = await pool.query(
      `SELECT customer.id AS customer_id, customer.name AS customer_name,
        store.id AS store_id, store.name AS store_name,
        (SELECT message.body FROM store_messages message
         WHERE message.store_id = store.id AND message.customer_id = customer.id
         ORDER BY message.id DESC LIMIT 1) AS last_message,
        (SELECT message.sender_role FROM store_messages message
         WHERE message.store_id = store.id AND message.customer_id = customer.id
         ORDER BY message.id DESC LIMIT 1) AS last_sender_role,
        (SELECT message.created_at FROM store_messages message
         WHERE message.store_id = store.id AND message.customer_id = customer.id
         ORDER BY message.id DESC LIMIT 1) AS updated_at
       FROM store_messages thread
       JOIN stores store ON store.id = thread.store_id
       JOIN customers customer ON customer.id = thread.customer_id
       WHERE store.seller_id = ?
       GROUP BY customer.id, customer.name, store.id, store.name
       ORDER BY updated_at DESC`,
      [sellerId],
    );
    return rows;
  }

  static async storeExists(storeId) {
    const [rows] = await pool.query(
      'SELECT id FROM stores WHERE id = ?',
      [storeId],
    );
    return rows.length > 0;
  }

  static async storeIsOpen(storeId) {
    const [rows] = await pool.query("SELECT id FROM stores WHERE id = ? AND status = 'open'", [storeId]);
    return rows.length > 0;
  }

  static async sellerOwnsStore(sellerId, storeId) {
    const [rows] = await pool.query('SELECT id FROM stores WHERE id = ? AND seller_id = ?', [storeId, sellerId]);
    return rows.length > 0;
  }

  static async customerExists(customerId) {
    const [rows] = await pool.query('SELECT id FROM customers WHERE id = ?', [customerId]);
    return rows.length > 0;
  }

  static async hasThread(storeId, customerId) {
    const [rows] = await pool.query(
      'SELECT id FROM store_messages WHERE store_id = ? AND customer_id = ? LIMIT 1',
      [storeId, customerId],
    );
    return rows.length > 0;
  }

  static async getThread(storeId, customerId) {
    const [rows] = await pool.query(
      `SELECT id, sender_role, body, created_at
       FROM store_messages WHERE store_id = ? AND customer_id = ?
       ORDER BY id ASC`,
      [storeId, customerId],
    );
    return rows;
  }

  static async create({ storeId, customerId, senderRole, senderId, body }) {
    const [result] = await pool.query(
      `INSERT INTO store_messages (store_id, customer_id, sender_role, sender_id, body)
       VALUES (?, ?, ?, ?, ?)`,
      [storeId, customerId, senderRole, senderId, body],
    );
    const [rows] = await pool.query(
      `SELECT id, sender_role, body, created_at
       FROM store_messages WHERE id = ?`,
      [result.insertId],
    );
    return rows[0];
  }
}

export default StoreMessage;