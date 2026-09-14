import jwt from 'jsonwebtoken';
import {
  api, auth, pool, prepareDatabase, closeDatabase, profileIdFor,
  makeCustomer, makeSeller, makeCourier, makeAdmin,
} from '../helpers/harness.js';
import User from '../../src/models/User.js';

describe('Registration and sign-in', () => {
  beforeAll(prepareDatabase);
  afterAll(closeDatabase);

  test('a customer can register and is given a token', async () => {
    const response = await api().post('/api/auth/register').send({
      name: 'Chanda Banda',
      email: 'chanda@zamglam.test',
      password: 'CUSTOMER123456',
      role: 'customer',
      address: 'Kabulonga, Lusaka',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ email: 'chanda@zamglam.test', role: 'customer' });
  });

  test('registering writes a real customer row', async () => {
    const customerId = await profileIdFor('customer', 'chanda@zamglam.test');
    expect(customerId).toEqual(expect.any(Number));
    const [rows] = await pool.query('SELECT name FROM customers WHERE id = ?', [customerId]);
    expect(rows[0].name).toBe('Chanda Banda');
  });

  test('the password is stored hashed, never as typed', async () => {
    const account = await User.findByEmail('chanda@zamglam.test');
    expect(account.password_hash).not.toBe('CUSTOMER123456');
    expect(account.password_hash.startsWith('$2')).toBe(true);
  });

  test('the same email cannot register twice', async () => {
    const response = await api().post('/api/auth/register').send({
      name: 'Someone Else', email: 'chanda@zamglam.test', password: 'OTHER123456', role: 'customer',
    });
    expect(response.status).toBe(409);
  });

  test('registration needs a name, an email and a password', async () => {
    const response = await api().post('/api/auth/register').send({ email: 'nobody@zamglam.test' });
    expect(response.status).toBe(400);
  });

  test('correct credentials sign in', async () => {
    const response = await api().post('/api/auth/login').send({ email: 'chanda@zamglam.test', password: 'CUSTOMER123456' });
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('customer');
  });

  test('a wrong password is refused', async () => {
    const response = await api().post('/api/auth/login').send({ email: 'chanda@zamglam.test', password: 'not-the-password' });
    expect(response.status).toBe(401);
  });

  test('an unknown email is refused the same way, giving nothing away', async () => {
    const wrongPassword = await api().post('/api/auth/login').send({ email: 'chanda@zamglam.test', password: 'nope' });
    const noSuchUser = await api().post('/api/auth/login').send({ email: 'ghost@zamglam.test', password: 'nope' });
    expect(noSuchUser.status).toBe(401);
    expect(noSuchUser.body.error).toBe(wrongPassword.body.error);
  });

  test('a new courier starts unapproved', async () => {
    const courier = await makeCourier({ approved: false });
    const [rows] = await pool.query('SELECT approval_status, is_active FROM couriers WHERE id = ?', [courier.courier_id]);
    expect(rows[0].approval_status).toBe('pending');
    expect(Number(rows[0].is_active)).toBe(0);
  });

  test('the token carries the signed-in role', async () => {
    const seller = await makeSeller();
    const claims = jwt.verify(seller.token, process.env.JWT_SECRET);
    expect(claims.role).toBe('seller');
  });

  test('a token signed with another secret is rejected', async () => {
    const forged = jwt.sign({ id: 1, email: 'attacker@zamglam.test', role: 'admin' }, 'some-other-secret');
    const response = await api().get('/api/admin/stats').set('Authorization', `Bearer ${forged}`);
    expect(response.status).toBe(401);
  });

  test('/auth/me needs a token', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
  });

  test('/auth/me returns the signed-in account', async () => {
    const customer = await makeCustomer();
    const response = await api().get('/api/auth/me').set(auth(customer));
    expect(response.status).toBe(200);
    expect(response.body.email ?? response.body.user?.email).toBe(customer.email);
  });

  test('a deleted account cannot sign in, even inside its restore window', async () => {
    const admin = await makeAdmin();
    const customer = await makeCustomer();

    await api().delete(`/api/admin/customer/${customer.profile_id}`).set(auth(admin)).expect(200);

    const refused = await api().post('/api/auth/login').send({ email: customer.email, password: customer.password });
    expect(refused.status).toBe(403);
    expect(refused.body.error).toMatch(/removed/i);
  });

  test('restoring the account lets them back in', async () => {
    const admin = await makeAdmin();
    const customer = await makeCustomer();

    await api().delete(`/api/admin/customer/${customer.profile_id}`).set(auth(admin)).expect(200);
    await api().patch(`/api/admin/customer/${customer.profile_id}/restore`).set(auth(admin)).expect(200);

    const response = await api().post('/api/auth/login').send({ email: customer.email, password: customer.password });
    expect(response.status).toBe(200);
  });
});
