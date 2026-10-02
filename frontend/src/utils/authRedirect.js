// Where somebody should land after signing in.
//
// Each role has its own home: a shop goes to its dashboard, a rider to theirs. A shopper
// with something in their basket goes to the basket, because that is almost certainly why
// they signed in.

export const DASHBOARD_PATHS = Object.freeze({
  admin: '/admin/dashboard',
  seller: '/seller/dashboard',
  courier: '/courier/dashboard',
  customer: '/',
});

export function dashboardForRole(role) {
  return DASHBOARD_PATHS[role] || '/';
}

function pathFromLocationState(from) {
  if (!from) return '';
  if (typeof from === 'string') return from;
  return `${from.pathname || ''}${from.search || ''}${from.hash || ''}`;
}

export function isSafeReturnPath(path, role) {
  if (!path || path === '/login' || path.startsWith('/login') || path.startsWith('/signup')) return false;
  const pathname = path.split(/[?#]/, 1)[0];
  const allowedRoots = {
    admin: ['/admin'],
    seller: ['/seller'],
    courier: ['/courier'],
    customer: ['/', '/collections', '/products', '/stores', '/cart', '/orders', '/product', '/customer'],
  }[role] || [];

  return allowedRoots.some((root) => (root === '/' ? pathname === '/' : pathname === root || pathname.startsWith(`${root}/`)));
}

export function getPostLoginPath(user, from, cartCount = 0) {
  const returnPath = pathFromLocationState(from);
  if (isSafeReturnPath(returnPath, user?.role)) return returnPath;
  if (user?.role === 'customer' && Number(cartCount) > 0) return '/cart';
  return dashboardForRole(user?.role);
}
