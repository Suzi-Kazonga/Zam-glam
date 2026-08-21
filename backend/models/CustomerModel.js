import { BaseModel } from './BaseModel.js';
import { pool } from '../config/db.js';

class CustomerModel extends BaseModel {
  constructor() {
    super('customers', pool);
  }

  async createCustomer(data) {
    const result = await this.create({
      name: data.name,
      email: data.email,
      password: data.password,
      address: data.address,
      phone: data.phone,
    });

    return result.insertId;
  }

  async findByEmail(email) {
    return this.findOne('email = ?', [email]);
  }
}

export default new CustomerModel();
