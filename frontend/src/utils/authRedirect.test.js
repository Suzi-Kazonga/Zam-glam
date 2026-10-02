import { dashboardForRole, getPostLoginPath, isSafeReturnPath } from './authRedirect.js';

describe('role-based post-login routing', () => {
  test.each([
    ['admin', '/admin/dashboard'],
    ['courier', '/courier/dashboard'],
    ['seller', '/seller/dashboard'],
    ['customer', '/'],
  ])('%s lands at its functional home', (role, expected) => {
    expect(dashboardForRole(role)).toBe(expected);
  });

  test('admin return paths cannot send them to shopping pages', () => {
    expect(getPostLoginPath({ role: 'admin' }, '/products')).toBe('/admin/dashboard');
    expect(isSafeReturnPath('/collections?sort=new', 'admin')).toBe(false);
  });

  test('customers can return to shopping and their basket', () => {
    expect(isSafeReturnPath('/products?category=shoes', 'customer')).toBe(true);
    expect(getPostLoginPath({ role: 'customer' }, null, 2)).toBe('/cart');
  });

  test('each operational role may resume inside its own module', () => {
    expect(isSafeReturnPath('/admin/users/sellers', 'admin')).toBe(true);
    expect(isSafeReturnPath('/courier/dashboard?tab=deliveries', 'courier')).toBe(true);
    expect(isSafeReturnPath('/seller/dashboard', 'seller')).toBe(true);
  });
});