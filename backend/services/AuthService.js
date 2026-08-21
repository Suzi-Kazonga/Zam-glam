import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import CustomerModel from '../models/CustomerModel.js';
import SellerModel from '../models/SellerModel.js';

export class AuthService {
  async signupCustomer(payload) {
    const existing = await CustomerModel.findByEmail(payload.email);
    if (existing) {
      throw Object.assign(new Error('Customer already exists.'), { statusCode: 409 });
    }

    const password = await bcrypt.hash(payload.password, 10);
    const customerId = await CustomerModel.createCustomer({
      ...payload,
      password,
    });

    return {
      user: {
        id: customerId,
        name: payload.name,
        email: payload.email,
        role: 'customer',
      },
      token: this.generateToken(customerId, payload.email, 'customer'),
    };
  }

  async signupSeller(payload) {
    const existing = await SellerModel.findByEmail(payload.email);
    if (existing) {
      throw Object.assign(new Error('Seller already exists.'), { statusCode: 409 });
    }

    const password = await bcrypt.hash(payload.password, 10);
    const sellerId = await SellerModel.createSeller({
      ...payload,
      password,
      shop_name: payload.shop_name,
    });

    return {
      user: {
        id: sellerId,
        name: payload.name,
        email: payload.email,
        role: 'seller',
      },
      token: this.generateToken(sellerId, payload.email, 'seller'),
    };
  }

  async loginCustomer(payload) {
    const customer = await CustomerModel.findByEmail(payload.email);
    if (!customer) {
      throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
    }

    const valid = await bcrypt.compare(payload.password, customer.password);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
    }

    return {
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: 'customer',
      },
      token: this.generateToken(customer.id, customer.email, 'customer'),
    };
  }

  async loginSeller(payload) {
    const seller = await SellerModel.findByEmail(payload.email);
    if (!seller) {
      throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
    }

    const valid = await bcrypt.compare(payload.password, seller.password);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
    }

    return {
      user: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        role: 'seller',
      },
      token: this.generateToken(seller.id, seller.email, 'seller'),
    };
  }

  generateToken(id, email, role) {
    return jwt.sign({ id, email, role }, process.env.JWT_SECRET || 'zamglam_super_secret_key', {
      expiresIn: '7d',
    });
  }
}

export default new AuthService();
