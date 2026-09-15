import {
  api, auth, pool, prepareDatabase, closeDatabase,
  makeSeller, makeCustomer, makeCourier, makeAdmin, listProduct, placeOrder, shipmentsOf, releaseParcel,
} from '../helpers/harness.js';

afterAll(closeDatabase);

// A complaint can only be made about somebody you actually dealt with, on an order you
// were part of. Three separate complaints against the same party raise it to an admin.
describe('Reporting another party on an order', () => {
  let shop;
  let customer;
  let courier;
  let orderId;

  beforeEach(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    customer = await makeCustomer();
    courier = await makeCourier();
    const product = await listProduct(shop);
    const order = await placeOrder(customer, [{ id: product.id }]);
    orderId = order.body.id;
    const [parcel] = await shipmentsOf(orderId);
    await releaseParcel(shop, parcel.id);
    await api().patch(`/api/orders/shipments/${parcel.id}/pickup-request`).set(auth(courier));
    await api().patch(`/api/orders/shipments/${parcel.id}/pickup-confirm`).set(auth(shop));
  });

  const report = (who, body) => api().post('/api/reports').set(auth(who)).send({ order_id: orderId, ...body });

  test('the order lists the parties you could report', async () => {
    const response = await api().get(`/api/reports/order/${orderId}/parties`).set(auth(customer));
    expect(response.status).toBe(200);
    expect(response.body.sellers.map((seller) => seller.id)).toContain(shop.profile_id);
    expect(response.body.couriers.map((rider) => rider.id)).toContain(courier.courier_id);
  });

  test('a customer can report the shop', async () => {
    const response = await report(customer, { reported_role: 'seller', reported_id: shop.profile_id, reason: 'Wrong item' });
    expect(response.status).toBe(201);
    expect(response.body.reports).toBe(1);
    expect(response.body.flagged).toBe(false);
  });

  test('a shop can report the courier', async () => {
    const response = await report(shop, { reported_role: 'courier', reported_id: courier.courier_id, reason: 'Late collection' });
    expect(response.status).toBe(201);
  });

  test('a courier can report the customer', async () => {
    const response = await report(courier, { reported_role: 'customer', reported_id: customer.profile_id, reason: 'Nobody at the address' });
    expect(response.status).toBe(201);
  });

  test('a reason is required', async () => {
    const response = await report(customer, { reported_role: 'seller', reported_id: shop.profile_id, reason: '   ' });
    expect(response.status).toBe(400);
  });

  test('you cannot report yourself', async () => {
    const response = await report(customer, { reported_role: 'customer', reported_id: customer.profile_id, reason: 'Testing' });
    expect(response.status).toBe(400);
  });

  test('you cannot report somebody who was not on the order', async () => {
    const otherShop = await makeSeller({ shop_name: 'Jets' });
    const response = await report(customer, { reported_role: 'seller', reported_id: otherShop.profile_id, reason: 'Never dealt with them' });
    expect(response.status).toBe(400);
  });

  test('somebody who was not on the order cannot report into it', async () => {
    const stranger = await makeCustomer();
    const response = await report(stranger, { reported_role: 'seller', reported_id: shop.profile_id, reason: 'Butting in' });
    expect(response.status).toBe(403);
  });

  test('a made-up party type is refused', async () => {
    const response = await report(customer, { reported_role: 'wizard', reported_id: 1, reason: 'Magic' });
    expect(response.status).toBe(400);
  });

  test('the same party cannot be reported twice for one order', async () => {
    await report(customer, { reported_role: 'seller', reported_id: shop.profile_id, reason: 'Wrong item' });
    const again = await report(customer, { reported_role: 'seller', reported_id: shop.profile_id, reason: 'Wrong item again' });
    expect(again.status).toBe(409);
  });

  test('reporting needs a signed-in account', async () => {
    const response = await api().post('/api/reports').send({ order_id: orderId, reported_role: 'seller', reported_id: shop.profile_id, reason: 'x' });
    expect(response.status).toBe(401);
  });
});

describe('Three complaints raise a flag', () => {
  let shop;
  let admin;
  let flaggedCount;

  beforeAll(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    admin = await makeAdmin();
    const product = await listProduct(shop, { stock: 50 });

    // Three different customers, three separate orders, three separate complaints.
    for (let i = 0; i < 3; i += 1) {
      const customer = await makeCustomer();
      const order = await placeOrder(customer, [{ id: product.id }]);
      const response = await api().post('/api/reports').set(auth(customer)).send({
        order_id: order.body.id,
        reported_role: 'seller',
        reported_id: shop.profile_id,
        reason: `Complaint ${i + 1}`,
      });
      flaggedCount = response.body.reports;
    }
  });

  test('the third complaint flags the party', async () => {
    expect(flaggedCount).toBe(3);
  });

  test('the admin queue shows them, flagged', async () => {
    const response = await api().get('/api/reports/admin/summary').set(auth(admin));
    expect(response.status).toBe(200);
    const flagged = response.body.find((row) => row.reported_role === 'seller' && row.reported_id === shop.profile_id);
    expect(flagged.report_count).toBe(3);
    expect(flagged.flagged).toBe(true);
    expect(flagged.name).toBe('Mud');
  });

  test('the admin can read the individual complaints', async () => {
    const response = await api().get(`/api/reports/admin/seller/${shop.profile_id}`).set(auth(admin));
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });

  test('only an admin can read the complaints queue', async () => {
    const response = await api().get('/api/reports/admin/summary').set(auth(shop));
    expect(response.status).toBe(403);
  });
});

describe('Suspending an account', () => {
  let shop;
  let customer;
  let admin;
  let product;

  beforeEach(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    customer = await makeCustomer();
    admin = await makeAdmin();
    product = await listProduct(shop, { stock: 20 });
  });

  const suspend = (role, id, reason) =>
    api().patch(`/api/reports/admin/${role}/${id}/status`).set(auth(admin)).send({ status: 'suspended', reason });

  test('an admin can suspend a shop', async () => {
    const response = await suspend('seller', shop.profile_id, 'Repeated complaints');
    expect(response.status).toBe(200);
    const [rows] = await pool.query('SELECT account_status, suspension_reason FROM sellers WHERE id = ?', [shop.profile_id]);
    expect(rows[0].account_status).toBe('suspended');
    expect(rows[0].suspension_reason).toBe('Repeated complaints');
  });

  test('a suspended shop is told so, with the reason', async () => {
    await suspend('seller', shop.profile_id, 'Repeated complaints');
    const response = await api().get('/api/reports/me/standing').set(auth(shop));
    expect(response.status).toBe(200);
    expect(response.body.suspended).toBe(true);
    expect(response.body.reason).toBe('Repeated complaints');
    expect(response.body.suspended_at).not.toBeNull();
  });

  test('a suspended shop cannot list new products', async () => {
    await suspend('seller', shop.profile_id, 'Repeated complaints');
    const response = await api().post('/api/products').set(auth(shop)).field('name', 'Still Selling').field('price', '100');
    expect(response.status).toBe(403);
    expect(response.body.suspended).toBe(true);
  });

  test('nobody can order from a suspended shop', async () => {
    await suspend('seller', shop.profile_id, 'Repeated complaints');
    const response = await placeOrder(customer, [{ id: product.id }]);
    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/suspended/i);
  });

  test('a basket filled before the suspension is refused too, not silently charged', async () => {
    // The shopper already had it in their cart; the product id still exists.
    await suspend('seller', shop.profile_id, 'Repeated complaints');
    const quote = await api().post('/api/orders/quote').set(auth(customer)).send({
      items: [{ product_id: product.id, quantity: 1 }], location: 'Lusaka',
    });
    expect(quote.status).toBe(409);
  });

  test('reinstating the shop lets people buy from it again', async () => {
    await suspend('seller', shop.profile_id, 'Repeated complaints');
    await api().patch(`/api/reports/admin/seller/${shop.profile_id}/status`).set(auth(admin)).send({ status: 'active' }).expect(200);
    const response = await placeOrder(customer, [{ id: product.id }]);
    expect(response.status).toBe(201);
  });

  test('a removed shop cannot be ordered from by guessing the product id', async () => {
    await api().delete(`/api/admin/seller/${shop.profile_id}`).set(auth(admin)).expect(200);
    const response = await placeOrder(customer, [{ id: product.id }]);
    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/no longer on Zamglam/i);
  });

  test('a suspended shopper cannot place orders', async () => {
    await suspend('customer', customer.profile_id, 'Chargebacks');
    const response = await placeOrder(customer, [{ id: product.id }]);
    expect(response.status).toBe(403);
  });

  test('a suspended courier is taken off duty', async () => {
    const courier = await makeCourier();
    await suspend('courier', courier.courier_id, 'Parcels going missing');
    const [rows] = await pool.query('SELECT on_shift FROM couriers WHERE id = ?', [courier.courier_id]);
    expect(Number(rows[0].on_shift)).toBe(0);
  });

  test('a suspended courier cannot go back on duty', async () => {
    const courier = await makeCourier();
    await suspend('courier', courier.courier_id, 'Parcels going missing');
    const response = await api().patch('/api/orders/courier/shift').set(auth(courier)).send({ on_shift: true });
    expect(response.status).toBe(403);
  });

  test('reinstating clears the suspension', async () => {
    await suspend('customer', customer.profile_id, 'Chargebacks');
    await api().patch(`/api/reports/admin/customer/${customer.profile_id}/status`).set(auth(admin)).send({ status: 'active' }).expect(200);
    const response = await placeOrder(customer, [{ id: product.id }]);
    expect(response.status).toBe(201);
  });

  test('a made-up status is refused', async () => {
    const response = await api().patch(`/api/reports/admin/seller/${shop.profile_id}/status`).set(auth(admin)).send({ status: 'banished' });
    expect(response.status).toBe(400);
  });

  test('a shop cannot suspend a rival', async () => {
    const rival = await makeSeller({ shop_name: 'Jets' });
    const response = await api().patch(`/api/reports/admin/seller/${rival.profile_id}/status`).set(auth(shop)).send({ status: 'suspended' });
    expect(response.status).toBe(403);
  });

  test('an account in good standing is told it is fine', async () => {
    const response = await api().get('/api/reports/me/standing').set(auth(customer));
    expect(response.body.suspended).toBe(false);
  });
});
