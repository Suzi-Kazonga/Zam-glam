export const CUSTOMER_CREDENTIALS = {
  email: 'customer@zamglam.local',
  password: 'Customer123!',
};

const CUSTOMER_USER = {
  id: 'customer-demo-1',
  name: 'Chanda Banda',
  email: CUSTOMER_CREDENTIALS.email,
  role: 'customer',
  phone: '+260 97 701 1101',
  address: 'Kabulonga, Lusaka',
};

export function loginAsLocalCustomer(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== CUSTOMER_CREDENTIALS.email) return null;

  // A real backend account can share this email (the seeded customer@zamglam.local does).
  // Fall through to the real login rather than throwing, so the real account stays reachable.
  if (password !== CUSTOMER_CREDENTIALS.password) return null;

  const token = 'customer-local-session';
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(CUSTOMER_USER));
  return { user: CUSTOMER_USER, token };
}
