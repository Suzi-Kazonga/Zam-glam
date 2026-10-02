import { jest } from '@jest/globals';
import { LOGIN_STRATEGIES } from './loginStrategies.js';

describe('role login strategies', () => {
  test.each(['admin', 'seller', 'courier', 'customer'])('%s strategy uses the shared auth contract', async (role) => {
    const login = jest.fn().mockResolvedValue({ user: { role } });
    const credentials = { email: `${role}@zamglam.test`, password: 'secret' };

    await expect(LOGIN_STRATEGIES[role].authenticate(credentials, login)).resolves.toMatchObject({ user: { role } });
    expect(login).toHaveBeenCalledWith(credentials.email, credentials.password, role);
  });

  test('role selectors expose an accessible label, symbol, and distinct description', () => {
    expect(LOGIN_STRATEGIES.admin).toMatchObject({ label: 'Admin', symbol: '🛡️' });
    expect(LOGIN_STRATEGIES.seller).toMatchObject({ label: 'Seller', symbol: '🏬' });
    expect(LOGIN_STRATEGIES.courier).toMatchObject({ label: 'Courier', symbol: '🚚' });
    expect(LOGIN_STRATEGIES.customer).toMatchObject({ label: 'Customer', symbol: '👤' });
    expect(new Set(Object.values(LOGIN_STRATEGIES).map(({ description }) => description)).size).toBe(4);
  });
});