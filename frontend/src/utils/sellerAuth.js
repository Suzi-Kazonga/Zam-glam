import { ensureDemoSellerProducts } from './productStore';

export const SELLER_CREDENTIALS = {
  email: 'seller@zamglam.local',
  password: 'Seller123!',
};

const SELLER_USER = {
  id: 'seller-demo-1',
  name: 'Mud',
  shop_name: 'Mud',
  email: SELLER_CREDENTIALS.email,
  role: 'seller',
  phone: '+260 97 111 0001',
};

export function loginAsLocalSeller(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== SELLER_CREDENTIALS.email) return null;

  if (password !== SELLER_CREDENTIALS.password) {
    const error = new Error('Invalid seller password');
    error.error = 'Invalid seller email or password.';
    throw error;
  }

  ensureDemoSellerProducts(SELLER_USER.email);

  const token = 'seller-local-session';
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(SELLER_USER));
  return { user: SELLER_USER, token };
}
