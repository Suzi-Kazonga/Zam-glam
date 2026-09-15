import { pool } from '../config/db.js';

// Verification documents belong to a seller. They are keyed by seller_id rather than
// user_id because documents.user_id is foreign-keyed to `users`, and in this schema shape
// sellers hold their own logins — a seller id is not a users id, so the old user_id write
// failed with a foreign key error for every real seller.
class Document {
  // Record a document a shop has uploaded. It starts as pending review.
  static async create({ seller_id, type, url, doc_number }) {
    const [result] = await pool.query(
      'INSERT INTO documents (seller_id, type, url, doc_number, status) VALUES (?, ?, ?, ?, ?)',
      [seller_id, type, url, doc_number || null, 'pending'],
    );
    return result.insertId;
  }

  // One shop’s own documents.
  static async findBySeller(seller_id) {
    const [rows] = await pool.query('SELECT * FROM documents WHERE seller_id = ? ORDER BY created_at DESC', [seller_id]);
    return rows;
  }

  // Every seller's documents, for the admin review queue.
  // Every document with the shop it belongs to, for the admin queue.
  static async findAllWithSellers() {
    const [rows] = await pool.query(
      `SELECT d.*, s.shop_name, s.email AS seller_email, s.verification_status
       FROM documents d JOIN sellers s ON s.id = d.seller_id
       ORDER BY d.created_at DESC`,
    );
    return rows;
  }

  // One document.
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM documents WHERE id = ?', [id]);
    return rows[0];
  }

  // An administrator accepts or rejects one document, with an optional note saying why.
  static async updateStatus(id, status, review_note) {
    const [result] = await pool.query(
      'UPDATE documents SET status = ?, review_note = ? WHERE id = ?',
      [status, review_note || null, id],
    );
    return result.affectedRows > 0;
  }

  // Remove a document.
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM documents WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default Document;
