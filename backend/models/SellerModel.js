import { BaseModel } from './BaseModel.js';
import { pool } from '../config/db.js';

class SellerModel extends BaseModel {
  constructor() {
    super('sellers', pool);
  }

  async createSeller(data) {
    const result = await this.create({
      name: data.name,
      email: data.email,
      password: data.password,
      shop_name: data.shop_name,
      phone: data.phone,
    });

    return result.insertId;
  }

  async findByEmail(email) {
    return this.findOne('email = ?', [email]);
  }
}

export default new SellerModel();
