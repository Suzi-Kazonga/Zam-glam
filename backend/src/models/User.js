import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

class User {
  // Create a new user
  static async create({ name, email, password, phone, role, address, shop_name }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await pool.getConnection();
    const accountRole = role || 'customer';

    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, accountRole],
      );

      if (accountRole === 'seller') {
        await connection.query(
          'INSERT INTO sellers (user_id, shop_name, phone) VALUES (?, ?, ?)',
          [result.insertId, shop_name || `${name}'s store`, phone || ''],
        );
      } else {
        await connection.query(
          'INSERT INTO customers (user_id, name, address, phone) VALUES (?, ?, ?, ?)',
          [result.insertId, name, address || '', phone || ''],
        );
      }

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const query = `SELECT u.id, u.email, u.password AS password_hash, u.role,
      COALESCE(c.name, s.shop_name, 'Admin') AS name,
      COALESCE(c.phone, s.phone, '') AS phone
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      LEFT JOIN sellers s ON s.user_id = u.id
      WHERE u.email = ?`;
    const [rows] = await pool.query(query, [email]);
    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = `SELECT u.id, u.email, u.role, u.created_at,
      COALESCE(c.name, s.shop_name, 'Admin') AS name,
      COALESCE(c.phone, s.phone, '') AS phone
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      LEFT JOIN sellers s ON s.user_id = u.id
      WHERE u.id = ?`;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user
  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'password_hash' && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(query, values);

    return result.affectedRows > 0;
  }
}

export default User;
