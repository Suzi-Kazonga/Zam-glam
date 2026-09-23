// The three hardcoded demo logins (utils/adminAuth.js, customerAuth.js, sellerAuth.js) issue
// sentinel tokens for a quick UI-only preview session that has no matching row in MySQL.
// Any real backend call made with one of these tokens will fail (401 or missing records),
// so callers should check this first and show a clear message instead of a broken request.
const LOCAL_SESSION_TOKENS = new Set([
  'admin-local-session',
  'customer-local-session',
  'seller-local-session',
]);

export function isLocalDemoSession() {
  try {
    return LOCAL_SESSION_TOKENS.has(localStorage.getItem('token'));
  } catch {
    return false;
  }
}

export const LOCAL_DEMO_ORDER_MESSAGE =
  'Demo accounts are for browsing only and don’t save orders. Sign up, or sign in as customer@zamglam.local / CUSTOMER123456 (seeded backend account), to place a real order.';
