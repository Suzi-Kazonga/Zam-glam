import { sameDatabaseId } from '../../src/utils/accounts.js';

describe('database account IDs', () => {
  test('compares equivalent numeric IDs consistently across database result types', () => {
    expect(sameDatabaseId(17, '17')).toBe(true);
  });

  test('does not consider different, invalid, or unsafe IDs equivalent', () => {
    expect(sameDatabaseId(17, '18')).toBe(false);
    expect(sameDatabaseId(null, 0)).toBe(false);
    expect(sameDatabaseId(Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  });
});
