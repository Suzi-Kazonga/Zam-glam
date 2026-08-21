import { pool } from '../config/db.js';

class Document {
  // Upload a document
  static async create({ user_id, type, url }) {
    const query = 'INSERT INTO documents (user_id, type, url) VALUES (?, ?, ?)';

    const [result] = await pool.query(query, [user_id, type, url]);

    return result.insertId;
  }

  // Get documents by user
  static async findByUser(user_id) {
    const query = 'SELECT * FROM documents WHERE user_id = ?';
    const [rows] = await pool.query(query, [user_id]);
    return rows;
  }

  // Find document by ID
  static async findById(id) {
    const query = 'SELECT * FROM documents WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Update document status
  static async updateStatus(id, status) {
    const query = 'UPDATE documents SET status = ? WHERE id = ?';
    const [result] = await pool.query(query, [status, id]);
    return result.affectedRows > 0;
  }

  // Delete document
  static async delete(id) {
    const query = 'DELETE FROM documents WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  }
}

export default Document;
