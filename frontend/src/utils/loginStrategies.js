function createLoginStrategy(role, label, symbol, description) {
  return Object.freeze({
    role,
    label,
    symbol,
    description,
    authenticate: ({ email, password }, login) => login(email, password, role),
  });
}

export const LOGIN_STRATEGIES = Object.freeze({
  admin: createLoginStrategy('admin', 'Admin', '🛡️', 'Administrator access for marketplace operations.'),
  seller: createLoginStrategy('seller', 'Seller', '🏬', 'Manage your shop, products, and orders.'),
  courier: createLoginStrategy('courier', 'Courier', '🚚', 'Access your delivery work and duty status.'),
  customer: createLoginStrategy('customer', 'Customer', '👤', 'Sign in to shop and manage your orders.'),
});