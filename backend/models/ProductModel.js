import { BaseModel } from './BaseModel.js';
import { pool } from '../config/db.js';

class ProductModel extends BaseModel {
  constructor() {
    super('products', pool);
  }

  async getAll() {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
    return rows;
  }

  async getBySeller(sellerId) {
    const [rows] = await pool.query('SELECT * FROM products WHERE seller_id = ? ORDER BY id DESC', [sellerId]);
    return rows;
  }
}

export default new ProductModel();
