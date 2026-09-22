export function dashboardForRole(role) {
  if (role === 'seller') return '/seller/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'courier') return '/courier/dashboard';
  return '/customer/dashboard';
}

function pathFromLocationState(from) {
  if (!from) return '';
  if (typeof from === 'string') return from;
  return `${from.pathname || ''}${from.search || ''}${from.hash || ''}`;
}

export function isSafeReturnPath(path, role) {
  if (!path || path === '/login' || path.startsWith('/login') || path.startsWith('/signup')) return false;
  if (path.startsWith('/admin') && role !== 'admin') return false;
  if (path.startsWith('/seller') && role !== 'seller') return false;
  if (path.startsWith('/customer') && role !== 'customer') return false;
  if (path.startsWith('/courier') && role !== 'courier') return false;
  return path.startsWith('/');
}

export function getPostLoginPath(user, from, cartCount = 0) {
  const returnPath = pathFromLocationState(from);

  if (user?.role === 'seller') return '/seller/dashboard';
  if (user?.role === 'courier') return '/courier/dashboard';
  if (user?.role === 'admin') return '/admin/dashboard';

  if (isSafeReturnPath(returnPath, user?.role)) return returnPath;
  if (user?.role === 'customer' && Number(cartCount) > 0) return '/cart';
  return dashboardForRole(user?.role);
}
