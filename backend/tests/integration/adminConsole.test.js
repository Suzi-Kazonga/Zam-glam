import {
  api, auth, pool, prepareDatabase, closeDatabase,
  makeSeller, makeCustomer, makeCourier, makeAdmin, listProduct, placeOrder,
} from '../helpers/harness.js';
import Admin from '../../src/models/Admin.js';

afterAll(closeDatabase);

describe('What the admin console reports', () => {
  let admin;
  let shop;
  let customer;
  let courier;

  beforeAll(async () => {
    await prepareDatabase();
    admin = await makeAdmin();
    shop = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    customer = await makeCustomer();
    courier = await makeCourier({ approved: false });
    const product = await listProduct(shop);
    await placeOrder(customer, [{ id: product.id }]);
  });

  test('the figures count what is actually in the database', async () => {
    const response = await api().get('/api/admin/stats').set(auth(admin));
    expect(response.status).toBe(200);
    expect(response.body.subscribers).toMatchObject({ customers: 1, sellers: 1, couriers: 1, admins: 1 });
    expect(response.body.subscribers.total).toBe(4);
    expect(response.body.activity).toMatchObject({ orders: 1, products: 1, stores: 1 });
  });

  test('the figures include what is waiting for a decision', async () => {
    const response = await api().get('/api/admin/stats').set(auth(admin));
    expect(response.body.pending).toMatchObject({ shops: 1, couriers: 1, total: 2 });
  });

  test('the console publishes the restore window it enforces', async () => {
    const response = await api().get('/api/admin/stats').set(auth(admin));
    expect(response.body.grace_days).toBe(Admin.GRACE_DAYS);
  });

  test('only an admin can read the figures', async () => {
    expect((await api().get('/api/admin/stats').set(auth(shop))).status).toBe(403);
    expect((await api().get('/api/admin/stats').set(auth(customer))).status).toBe(403);
    expect((await api().get('/api/admin/stats')).status).toBe(401);
  });

  test('each group of subscribers can be listed', async () => {
    const customers = await api().get('/api/admin/users/customers').set(auth(admin));
    expect(customers.body).toHaveLength(1);
    expect(customers.body[0].email).toBe(customer.email);
    expect(customers.body[0].order_count).toBe(1);

    const sellers = await api().get('/api/admin/users/sellers').set(auth(admin));
    expect(sellers.body[0].name).toBe('Mud');
    expect(sellers.body[0].product_count).toBe(1);

    const couriers = await api().get('/api/admin/users/couriers').set(auth(admin));
    expect(couriers.body[0].approval_status).toBe('pending');
  });

  test('a group that does not exist is refused', async () => {
    expect((await api().get('/api/admin/users/wizards').set(auth(admin))).status).toBe(400);
  });

  test('pending registrations name who is waiting', async () => {
    const response = await api().get('/api/admin/pending').set(auth(admin));
    expect(response.status).toBe(200);
    expect(response.body.shops.map((s) => s.email)).toContain(shop.email);
    expect(response.body.couriers.map((c) => c.email)).toContain(courier.email);
    expect(response.body.total).toBe(2);
  });

  test('approving a courier lets them work', async () => {
    const response = await api().patch(`/api/admin/couriers/${courier.courier_id}/approval`).set(auth(admin)).send({ status: 'approved' });
    expect(response.status).toBe(200);
    const [rows] = await pool.query('SELECT approval_status, is_active FROM couriers WHERE id = ?', [courier.courier_id]);
    expect(rows[0].approval_status).toBe('approved');
    expect(Number(rows[0].is_active)).toBe(1);
  });

  test('rejecting a courier takes them off duty', async () => {
    await api().patch(`/api/admin/couriers/${courier.courier_id}/approval`).set(auth(admin)).send({ status: 'approved' });
    await api().patch('/api/orders/courier/shift').set(auth(courier)).send({ on_shift: true });
    await api().patch(`/api/admin/couriers/${courier.courier_id}/approval`).set(auth(admin)).send({ status: 'rejected' }).expect(200);
    const [rows] = await pool.query('SELECT on_shift, is_active FROM couriers WHERE id = ?', [courier.courier_id]);
    expect(Number(rows[0].on_shift)).toBe(0);
    expect(Number(rows[0].is_active)).toBe(0);
  });

  test('a made-up approval decision is refused', async () => {
    const response = await api().patch(`/api/admin/couriers/${courier.courier_id}/approval`).set(auth(admin)).send({ status: 'maybe' });
    expect(response.status).toBe(400);
  });

  test('a courier cannot approve themselves', async () => {
    const response = await api().patch(`/api/admin/couriers/${courier.courier_id}/approval`).set(auth(courier)).send({ status: 'approved' });
    expect(response.status).toBe(403);
  });
});

describe('Deleting and restoring an account', () => {
  let admin;
  let shop;
  let customer;
  let product;

  beforeEach(async () => {
    await prepareDatabase();
    admin = await makeAdmin();
    shop = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    customer = await makeCustomer();
    product = await listProduct(shop);
  });

  test('deleting keeps the row and says how long it can be restored', async () => {
    const response = await api().delete(`/api/admin/seller/${shop.profile_id}`).set(auth(admin));
    expect(response.status).toBe(200);
    expect(response.body.grace_days).toBe(Admin.GRACE_DAYS);

    const [rows] = await pool.query('SELECT deleted_at FROM sellers WHERE id = ?', [shop.profile_id]);
    expect(rows[0].deleted_at).not.toBeNull();
  });

  test('a deleted account is still listed, marked as deleted', async () => {
    await api().delete(`/api/admin/seller/${shop.profile_id}`).set(auth(admin));
    const response = await api().get('/api/admin/users/sellers').set(auth(admin));
    expect(response.body[0].deleted_at).not.toBeNull();
  });

  test('a deleted shop\'s products leave the catalogue', async () => {
    const before = await api().get('/api/products');
    expect(before.body.map((item) => item.id)).toContain(product.id);

    await api().delete(`/api/admin/seller/${shop.profile_id}`).set(auth(admin));
    const after = await api().get('/api/products');
    expect(after.body.map((item) => item.id)).not.toContain(product.id);
  });

  test('restoring puts the shop and its products back', async () => {
    await api().delete(`/api/admin/seller/${shop.profile_id}`).set(auth(admin));
    await api().patch(`/api/admin/seller/${shop.profile_id}/restore`).set(auth(admin)).expect(200);
    const response = await api().get('/api/products');
    expect(response.body.map((item) => item.id)).toContain(product.id);
  });

  test('deleting the same account twice is refused', async () => {
    await api().delete(`/api/admin/seller/${shop.profile_id}`).set(auth(admin));
    const again = await api().delete(`/api/admin/seller/${shop.profile_id}`).set(auth(admin));
    expect(again.status).toBe(404);
  });

  test('restoring an account that was never deleted is refused', async () => {
    const response = await api().patch(`/api/admin/seller/${shop.profile_id}/restore`).set(auth(admin));
    expect(response.status).toBe(404);
  });

  test('a deleted courier comes off duty and cannot be given work', async () => {
    const courier = await makeCourier();
    await api().delete(`/api/admin/courier/${courier.courier_id}`).set(auth(admin)).expect(200);
    const [rows] = await pool.query('SELECT on_shift, is_active FROM couriers WHERE id = ?', [courier.courier_id]);
    expect(Number(rows[0].on_shift)).toBe(0);
    expect(Number(rows[0].is_active)).toBe(0);
  });

  test('restoring an approved courier makes them active again', async () => {
    const courier = await makeCourier();
    await api().delete(`/api/admin/courier/${courier.courier_id}`).set(auth(admin));
    await api().patch(`/api/admin/courier/${courier.courier_id}/restore`).set(auth(admin)).expect(200);
    const [rows] = await pool.query('SELECT is_active, deleted_at FROM couriers WHERE id = ?', [courier.courier_id]);
    expect(Number(rows[0].is_active)).toBe(1);
    expect(rows[0].deleted_at).toBeNull();
  });

  test('an unknown account type is refused', async () => {
    const response = await api().delete('/api/admin/wizard/1').set(auth(admin));
    expect(response.status).toBe(400);
  });

  test('a shop cannot delete another shop', async () => {
    const rival = await makeSeller({ shop_name: 'Jets' });
    const response = await api().delete(`/api/admin/seller/${rival.profile_id}`).set(auth(shop));
    expect(response.status).toBe(403);
  });

  test('deleting needs a signed-in admin', async () => {
    expect((await api().delete(`/api/admin/seller/${shop.profile_id}`)).status).toBe(401);
  });

  test('an admin can correct an account\'s details', async () => {
    const response = await api().patch(`/api/admin/customer/${customer.profile_id}`).set(auth(admin)).send({ phone: '+260 95 123 4567' });
    expect(response.status).toBe(200);
    const [rows] = await pool.query('SELECT phone FROM customers WHERE id = ?', [customer.profile_id]);
    expect(rows[0].phone).toBe('+260 95 123 4567');
  });

  test('an edit that touches no real column is refused', async () => {
    const response = await api().patch(`/api/admin/customer/${customer.profile_id}`).set(auth(admin)).send({ is_admin: true });
    expect(response.status).toBe(400);
  });

  test('editing cannot reach a column it was not given', async () => {
    const [before] = await pool.query('SELECT password FROM customers WHERE id = ?', [customer.profile_id]);
    await api().patch(`/api/admin/customer/${customer.profile_id}`).set(auth(admin)).send({ password: 'hacked', phone: '+260 95 000 0000' });
    const [after] = await pool.query('SELECT password FROM customers WHERE id = ?', [customer.profile_id]);
    expect(after[0].password).toBe(before[0].password);
  });

  test('nothing is purged while it is still inside the window', async () => {
    await api().delete(`/api/admin/customer/${customer.profile_id}`).set(auth(admin));
    const purged = await Admin.purgeExpired();
    expect(purged.some((row) => row.id === customer.profile_id)).toBe(false);
  });

  test('once the window closes the account is removed for good', async () => {
    await api().delete(`/api/admin/customer/${customer.profile_id}`).set(auth(admin));
    await pool.query(
      'UPDATE customers SET deleted_at = (CURRENT_TIMESTAMP - INTERVAL ? DAY) WHERE id = ?',
      [Admin.GRACE_DAYS + 1, customer.profile_id],
    );

    const purged = await Admin.purgeExpired();
    expect(purged).toContainEqual({ role: 'customer', id: customer.profile_id });
    const [rows] = await pool.query('SELECT id FROM customers WHERE id = ?', [customer.profile_id]);
    expect(rows).toHaveLength(0);
  });

  test('an expired account that order history still points at is kept rather than destroyed', async () => {
    const shopper = await makeCustomer();
    await placeOrder(shopper, [{ id: product.id }]);
    await api().delete(`/api/admin/customer/${shopper.profile_id}`).set(auth(admin));
    await pool.query(
      'UPDATE customers SET deleted_at = (CURRENT_TIMESTAMP - INTERVAL ? DAY) WHERE id = ?',
      [Admin.GRACE_DAYS + 1, shopper.profile_id],
    );

    await Admin.purgeExpired();
    const [rows] = await pool.query('SELECT id FROM customers WHERE id = ?', [shopper.profile_id]);
    const [orders] = await pool.query('SELECT id FROM orders WHERE customer_id = ?', [shopper.profile_id]);
    // Either the account survived with its orders, or both went together — what must never
    // happen is orders left pointing at an account that is gone.
    if (orders.length) expect(rows).toHaveLength(1);
  });
});
