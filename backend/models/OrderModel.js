import { BaseModel } from './BaseModel.js';
import { pool } from '../config/db.js';

class OrderModel extends BaseModel {
  constructor() {
    super('orders', pool);
  }

  async createOrder(data) {
    const result = await this.create({
      customer_id: data.customer_id,
      product_id: data.product_id,
      quantity: data.quantity,
      status: data.status || 'pending',
    });

    return result.insertId;
  }

  async getByCustomer(customerId) {
    const [rows] = await pool.query(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
    return rows;
  }
}

export default new OrderModel();
