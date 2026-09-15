import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

// Accounts: creating them, finding them, and checking a password.
//
// There is no single "users" table in a current database. A shopper lives in `customers`,
// a shop in `sellers`, a rider in `couriers`, an administrator in `admins`, and each row
// holds its own email and password. This class is what hides that spread from the rest of
// the code, which only ever asks "find me the account with this email".
//
// Databases built by earlier versions did have one central `users` table that the others
// linked to, and those still work: every method below checks which shape it is looking at
// before it queries.
class User {
  // Does this table have this column?
  //
  // Used to tell the two database shapes apart. A `user_id` column on `customers` means
  // the older layout, where logins live in a central table.
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

  // Create an account of whichever kind was asked for.
  //
  // Wrapped in a transaction because the older layout writes two rows — the login and the
  // profile — and an account with one but not the other could never sign in.
  //
  // The password is hashed with bcrypt before it goes anywhere near the database, so a
  // stolen copy of the data does not hand over anybody’s password.
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
        } else if (accountRole === 'courier') {
          await connection.query(
            // A new rider waits for an admin to approve them, and is inactive until then —
            // the same rule as on the other layout. The email is copied across so the admin
            // console can show who a rider is; signing in still goes through `users`.
            "INSERT INTO couriers (user_id, name, email, phone, approval_status, is_active) VALUES (?, ?, ?, ?, 'pending', 0)",
            [result.insertId, name, email, phone || ''],
          );
        } else if (accountRole === 'admin') {
          // Without this an admin fell through to the customers table: the account could
          // sign in and moderate, but the console counted no admins and listed them as a
          // shopper.
          await connection.query(
            'INSERT INTO admins (user_id, name, email) VALUES (?, ?, ?)',
            [result.insertId, name, email],
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

      if (accountRole === 'courier') {
        const [result] = await connection.query(
          // New couriers wait for admin approval before they can be given parcels.
          "INSERT INTO couriers (name, email, password, phone, approval_status, is_active) VALUES (?, ?, ?, ?, 'pending', 0)",
          [name, email, hashedPassword, phone || ''],
        );
        await connection.commit();
        return result.insertId;
      }

      if (accountRole === 'admin') {
        const [result] = await connection.query(
          'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
          [name, email, hashedPassword],
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

  // Find whoever owns this email, whatever kind of account they have.
  //
  // Each table is tried in turn and the answer is normalised to the same shape — id, name,
  // email, role, password_hash — so sign-in does not care which table it came from.
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

      const [courierRows] = await pool.query(
        'SELECT id, name, email, password, phone FROM couriers WHERE LOWER(email) = ? LIMIT 1',
        [normalizedEmail],
      );

      if (courierRows[0]) {
        return {
          id: courierRows[0].id,
          email: courierRows[0].email,
          name: courierRows[0].name,
          phone: courierRows[0].phone,
          role: 'courier',
          password_hash: courierRows[0].password,
        };
      }

      const [adminRows] = await pool.query(
        'SELECT id, name, email, password FROM admins WHERE LOWER(email) = ? LIMIT 1',
        [normalizedEmail],
      );

      if (adminRows[0]) {
        return {
          id: adminRows[0].id,
          email: adminRows[0].email,
          name: adminRows[0].name,
          role: 'admin',
          password_hash: adminRows[0].password,
        };
      }

      return undefined;
    }

    const query = `SELECT u.id, u.email, u.password AS password_hash, u.role,
      COALESCE(c.name, s.shop_name, cr.name, 'Admin') AS name,
      COALESCE(c.phone, s.phone, cr.phone, '') AS phone
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      LEFT JOIN sellers s ON s.user_id = u.id
      LEFT JOIN couriers cr ON cr.user_id = u.id
      WHERE u.email = ?`;
    const [rows] = await pool.query(query, [normalizedEmail]);
    return rows[0];
  }

  // Fetch an account by id, without its password.
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

      const [courierRows] = await pool.query(
        'SELECT id, name, email, password, phone FROM couriers WHERE id = ? LIMIT 1',
        [id],
      );

      if (courierRows[0]) {
        return {
          id: courierRows[0].id,
          email: courierRows[0].email,
          name: courierRows[0].name,
          phone: courierRows[0].phone,
          role: 'courier',
          password_hash: courierRows[0].password,
        };
      }

      return undefined;
    }

    const query = `SELECT u.id, u.email, u.role, u.created_at,
      COALESCE(c.name, s.shop_name, cr.name, 'Admin') AS name,
      COALESCE(c.phone, s.phone, cr.phone, '') AS phone
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      LEFT JOIN sellers s ON s.user_id = u.id
      LEFT JOIN couriers cr ON cr.user_id = u.id
      WHERE u.id = ?`;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Is this the right password?
  //
  // bcrypt re-hashes the attempt with the same salt and compares. The stored hash can
  // never be turned back into the password, which is the point.
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Change an account’s own details.
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
