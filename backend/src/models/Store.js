import { pool } from '../config/db.js';
import Product from './Product.js';

// A shop’s storefront: the page shoppers visit, as opposed to the seller account that
// signs in. One seller has one store.
class Store {
  // Create a new store
  // Open a storefront for a shop.
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
  // The columns every store query needs, in one place.
  //
  // A storefront is never shown on its own: shoppers need to know whether the shop was
  // verified, whether it is suspended, and what people have scored it. Written once here
  // so those can never drift apart between queries.
  static get selectWithSeller() {
    return `SELECT st.*, s.verification_status, s.shop_name, s.account_status, s.deleted_at,
                   COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.seller_id = s.id), 1), 0) AS rating_average,
                   (SELECT COUNT(*) FROM reviews r WHERE r.seller_id = s.id) AS rating_count
            FROM stores st JOIN sellers s ON s.id = st.seller_id`;
  }

  // Find store by ID
  // One storefront by its id.
  static async findById(id) {
    const [rows] = await pool.query(`${Store.selectWithSeller} WHERE st.id = ?`, [id]);
    return rows[0];
  }

  // Find store by seller ID
  // "Which store is mine?" — the storefront belonging to a shop account.
  static async findBySellerId(seller_id) {
    const query = 'SELECT * FROM stores WHERE seller_id = ?';
    const [rows] = await pool.query(query, [seller_id]);
    return rows[0];
  }

  // Get all stores
  // Every storefront that is open for business.
  static async getAll() {
    const [rows] = await pool.query(`${Store.selectWithSeller} WHERE st.status = 'open' ORDER BY st.id`);
    return rows;
  }

  // Get products for a store with filters. Delegates to Product so storefront products
  // carry store/category names and have their JSON columns parsed — MariaDB returns those
  // as raw strings, which would leave images as a string rather than an array.
  // What one storefront is selling.
  //
  // Handed to Product, which already joins the shop and category and turns MariaDB’s text
  // JSON columns back into arrays. Doing it separately here is what once made a storefront
  // show photo galleries as a single "[" character.
  static async getProducts(store_id, filters = {}) {
    return Product.getFiltered({
      store_id,
      audience: filters.audience,
      category_id: filters.category,
    });
  }

  // Update store
  // Change a storefront’s details.
  //
  // Only the listed columns can be written. The form sends extra helper fields, and
  // without this filter they would end up in the SQL and fail with "Unknown column".
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
