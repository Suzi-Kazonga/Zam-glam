import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

class User {
  static async columnExists(tableName, columnName) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM information_schema.columns
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
      [tableName, columnName],
    );

    return Number(rows[0]?.count || 0) > 0;
  }

  static async create({ name, email, password, phone, role, address, shop_name, location }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await pool.getConnection();
    const accountRole = String(role || 'customer').toLowerCase();
    const hasLegacyUserId = await User.columnExists('customers', 'user_id');

    try {
      await connection.beginTransaction();

      if (hasLegacyUserId) {
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
            'INSERT INTO customers (user_id, name, address, phone, location) VALUES (?, ?, ?, ?, ?)',
            [result.insertId, name, address || '', phone || '', location || ''],
          );
        }

        await connection.commit();
        return result.insertId;
      }

      if (accountRole === 'seller') {
        const [result] = await connection.query(
          'INSERT INTO sellers (name, email, password, shop_name, phone) VALUES (?, ?, ?, ?, ?)',
          [name, email, hashedPassword, shop_name || `${name}'s store`, phone || ''],
        );
        await connection.commit();
        return result.insertId;
      }

      const [result] = await connection.query(
        'INSERT INTO customers (name, email, password, address, phone, location) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, address || '', phone || '', location || ''],
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findByEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const hasLegacyUserId = await User.columnExists('customers', 'user_id');

    if (!hasLegacyUserId) {
      const [customerRows] = await pool.query(
        'SELECT id, name, email, password, address, phone FROM customers WHERE LOWER(email) = ? LIMIT 1',
        [normalizedEmail],
      );

      if (customerRows[0]) {
        return {
          id: customerRows[0].id,
          email: customerRows[0].email,
          name: customerRows[0].name,
          phone: customerRows[0].phone,
          role: 'customer',
          password_hash: customerRows[0].password,
        };
      }

      const [sellerRows] = await pool.query(
        'SELECT id, name, email, password, shop_name AS name, phone FROM sellers WHERE LOWER(email) = ? LIMIT 1',
        [normalizedEmail],
      );

      if (sellerRows[0]) {
        return {
          id: sellerRows[0].id,
          email: sellerRows[0].email,
          name: sellerRows[0].name,
          phone: sellerRows[0].phone,
          role: 'seller',
          password_hash: sellerRows[0].password,
        };
      }

      return undefined;
    }

    const query = `SELECT u.id, u.email, u.password AS password_hash, u.role,
      COALESCE(c.name, s.shop_name, 'Admin') AS name,
      COALESCE(c.phone, s.phone, '') AS phone
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      LEFT JOIN sellers s ON s.user_id = u.id
      WHERE u.email = ?`;
    const [rows] = await pool.query(query, [normalizedEmail]);
    return rows[0];
  }

  static async findById(id) {
    const hasLegacyUserId = await User.columnExists('customers', 'user_id');

    if (!hasLegacyUserId) {
      const [customerRows] = await pool.query(
        'SELECT id, name, email, password, address, phone FROM customers WHERE id = ? LIMIT 1',
        [id],
      );

      if (customerRows[0]) {
        return {
          id: customerRows[0].id,
          email: customerRows[0].email,
          name: customerRows[0].name,
          phone: customerRows[0].phone,
          role: 'customer',
          password_hash: customerRows[0].password,
        };
      }

      const [sellerRows] = await pool.query(
        'SELECT id, name, email, password, shop_name AS name, phone FROM sellers WHERE id = ? LIMIT 1',
        [id],
      );

      if (sellerRows[0]) {
        return {
          id: sellerRows[0].id,
          email: sellerRows[0].email,
          name: sellerRows[0].name,
          phone: sellerRows[0].phone,
          role: 'seller',
          password_hash: sellerRows[0].password,
        };
      }

      return undefined;
    }

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
