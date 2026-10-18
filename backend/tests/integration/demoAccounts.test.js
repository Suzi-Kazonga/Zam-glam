import {
  api, prepareDatabase, closeDatabase,
} from '../helpers/harness.js';
import User from '../../src/models/User.js';
import {
  DEMO_PASSWORD, DEMO_ADMIN_EMAIL, ensureDemoAdmin, resetDemoPasswords, prepareDemoAccounts,
} from '../../src/utils/demoAccounts.js';

// A teammate pulls the latest code onto a database seeded long ago. The documented demo
// password must work for them after a restart, without anybody remembering to re-seed —
// and nothing anybody registered for themselves may be touched in the process.

const signIn = (email, password, role) => api().post('/api/auth/login').send({ email, password, role });

describe('Keeping the demo accounts usable on every copy of the project', () => {
  beforeAll(prepareDatabase);
  afterAll(closeDatabase);

  test('a database with no administrator is given the demo one', async () => {
    expect(await User.findByEmail(DEMO_ADMIN_EMAIL)).toBeUndefined();

    expect(await ensureDemoAdmin()).toBe(true);
    expect((await signIn(DEMO_ADMIN_EMAIL, DEMO_PASSWORD, 'admin')).status).toBe(200);
  });

  test('and is left alone when it already has one', async () => {
    expect(await ensureDemoAdmin()).toBe(false);
  });

  test('a demo account on an old password is put back on the shared one', async () => {
    await User.create({ name: 'Mud', email: 'mud@zamglam.local', password: 'MUD123456', role: 'seller', shop_name: 'Mud' });
    expect((await signIn('mud@zamglam.local', DEMO_PASSWORD, 'seller')).status).toBe(401);

    expect(await resetDemoPasswords()).toBe(1);
    expect((await signIn('mud@zamglam.local', DEMO_PASSWORD, 'seller')).status).toBe(200);
  });

  test('an account somebody registered for themselves is never changed', async () => {
    await User.create({ name: 'Own Shop', email: 'own@example.com', password: 'MyOwnPass99', role: 'seller', shop_name: 'Own' });

    await prepareDemoAccounts();

    expect((await signIn('own@example.com', 'MyOwnPass99', 'seller')).status).toBe(200);
    expect((await signIn('own@example.com', DEMO_PASSWORD, 'seller')).status).toBe(401);
  });

  test('running it again changes nothing', async () => {
    expect(await prepareDemoAccounts()).toEqual({ createdAdmin: false, reset: 0 });
  });
});
