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
      address: data.address || null,
      phone: data.phone || null,
      city: data.city || null,
      country: data.country || 'Zambia',
      preferred_currency: data.preferred_currency || 'ZMW',
      newsletter_opt_in: data.newsletter_opt_in ?? true,
      marketing_opt_in: data.marketing_opt_in ?? false,
      is_active: data.is_active ?? true,
    });

    return result.insertId;
  }

  async findByEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    return this.findOne('LOWER(email) = ?', [normalizedEmail]);
  }
}

export default new CustomerModel();
