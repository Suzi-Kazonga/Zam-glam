import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import CustomerModel from '../models/CustomerModel.js';
import SellerModel from '../models/SellerModel.js';

export class AuthService {
  normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  async sendWelcomeEmail({ name, email, role }) {
    const subject = `Welcome to Zamglam, ${name}!`;
    const message = `Hi ${name},\n\nThanks for joining Zamglam as a ${role}. Your account is ready and you can start shopping right away.\n\nBest,\nZamglam Team`;

    if (!process.env.EMAIL_HOST && !process.env.SENDGRID_API_KEY && !process.env.MAILGUN_API_KEY) {
      console.log(`[welcome-email] To: ${email} | Subject: ${subject} | Message: ${message}`);
      return { queued: true, provider: 'console' };
    }

    return { queued: true, provider: 'external-email-service' };
  }

  async signupCustomer(payload) {
    const email = this.normalizeEmail(payload.email);
    if (!payload.name || !email || !payload.password) {
      throw Object.assign(new Error('Name, email, and password are required.'), { statusCode: 400 });
    }

    const existingCustomer = await CustomerModel.findByEmail(email);
    const existingSeller = await SellerModel.findByEmail(email);
    if (existingCustomer || existingSeller) {
      throw Object.assign(new Error('An account with this email already exists.'), { statusCode: 409 });
    }

    const password = await bcrypt.hash(payload.password, 10);
    const customerId = await CustomerModel.createCustomer({
      ...payload,
      email,
      password,
      city: payload.city || null,
      country: payload.country || 'Zambia',
      preferred_currency: payload.preferred_currency || 'ZMW',
      newsletter_opt_in: payload.newsletter_opt_in ?? true,
      marketing_opt_in: payload.marketing_opt_in ?? false,
      is_active: payload.is_active ?? true,
    });

    await this.sendWelcomeEmail({
      name: payload.name,
      email,
      role: 'customer',
    });

    return {
      user: {
        id: customerId,
        name: payload.name,
        email,
        role: 'customer',
      },
      token: this.generateToken(customerId, email, 'customer'),
    };
  }

  async signupSeller(payload) {
    const email = this.normalizeEmail(payload.email);
    if (!payload.name || !email || !payload.password) {
      throw Object.assign(new Error('Name, email, and password are required.'), { statusCode: 400 });
    }

    const existingCustomer = await CustomerModel.findByEmail(email);
    const existingSeller = await SellerModel.findByEmail(email);
    if (existingCustomer || existingSeller) {
      throw Object.assign(new Error('An account with this email already exists.'), { statusCode: 409 });
    }

    const password = await bcrypt.hash(payload.password, 10);
    const sellerId = await SellerModel.createSeller({
      ...payload,
      email,
      password,
      shop_name: payload.shop_name,
    });

    await this.sendWelcomeEmail({
      name: payload.name,
      email,
      role: 'seller',
    });

    return {
      user: {
        id: sellerId,
        name: payload.name,
        email,
        role: 'seller',
      },
      token: this.generateToken(sellerId, email, 'seller'),
    };
  }

  async signupUser(payload) {
    const role = String(payload.role || 'customer').toLowerCase();
    if (role === 'seller') {
      return this.signupSeller(payload);
    }
    return this.signupCustomer(payload);
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
