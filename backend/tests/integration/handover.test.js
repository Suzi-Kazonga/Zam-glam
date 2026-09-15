import {
  api, auth, pool, prepareDatabase, closeDatabase,
  makeSeller, makeCustomer, makeCourier, makeAdmin, listProduct, placeOrder, shipmentsOf, releaseParcel,
} from '../helpers/harness.js';

afterAll(closeDatabase);

// Handing a parcel over takes both sides: the courier asks, and the shop confirms they
// really handed it to that person. Everything below is about that exchange.
describe('The pickup pool', () => {
  let shop;
  let customer;
  let parcelId;

  beforeEach(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    customer = await makeCustomer();
    const product = await listProduct(shop);
    const order = await placeOrder(customer, [{ id: product.id }]);
    [{ id: parcelId }] = await shipmentsOf(order.body.id);
  });

  test('a parcel the shop has not released is not in the pool', async () => {
    const courier = await makeCourier();
    const response = await api().get('/api/orders/shipments/available').set(auth(courier));
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('releasing a parcel puts it in the pool', async () => {
    const courier = await makeCourier();
    await releaseParcel(shop, parcelId).expect(200);
    const response = await api().get('/api/orders/shipments/available').set(auth(courier));
    expect(response.body.map((parcel) => parcel.id)).toContain(parcelId);
  });

  test('an off-duty courier is shown no work', async () => {
    const courier = await makeCourier({ onShift: false });
    await releaseParcel(shop, parcelId);
    const response = await api().get('/api/orders/shipments/available').set(auth(courier));
    expect(response.body).toEqual([]);
  });

  test('a courier waiting for approval cannot go on duty', async () => {
    const courier = await makeCourier({ approved: false });
    const response = await api().patch('/api/orders/courier/shift').set(auth(courier)).send({ on_shift: true });
    expect(response.status).toBe(403);
  });

  test('an approved courier can go on and off duty', async () => {
    const courier = await makeCourier({ onShift: false });
    await api().patch('/api/orders/courier/shift').set(auth(courier)).send({ on_shift: true }).expect(200);
    const on = await api().get('/api/orders/courier/shift').set(auth(courier));
    expect(on.body.on_shift).toBe(true);

    await api().patch('/api/orders/courier/shift').set(auth(courier)).send({ on_shift: false }).expect(200);
    const off = await api().get('/api/orders/courier/shift').set(auth(courier));
    expect(off.body.on_shift).toBe(false);
  });

  test('a shopper cannot see the pickup pool', async () => {
    const response = await api().get('/api/orders/shipments/available').set(auth(customer));
    expect(response.status).toBe(403);
  });

  test('an admin can see everything that is waiting for a courier', async () => {
    const admin = await makeAdmin();
    await releaseParcel(shop, parcelId);
    const response = await api().get('/api/orders/shipments/unclaimed').set(auth(admin));
    expect(response.status).toBe(200);
    expect(response.body.map((parcel) => parcel.shipment_id)).toContain(parcelId);
    expect(response.body[0].waiting_minutes).toEqual(expect.any(Number));
  });

  test('only an admin can see the unclaimed list', async () => {
    const response = await api().get('/api/orders/shipments/unclaimed').set(auth(shop));
    expect(response.status).toBe(403);
  });
});

describe('Requesting, confirming and denying a handover', () => {
  let shop;
  let customer;
  let courier;
  let orderId;
  let parcelId;

  beforeEach(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    customer = await makeCustomer();
    courier = await makeCourier();
    const product = await listProduct(shop);
    const order = await placeOrder(customer, [{ id: product.id }]);
    orderId = order.body.id;
    [{ id: parcelId }] = await shipmentsOf(orderId);
    await releaseParcel(shop, parcelId);
  });

  const request = (who = courier) => api().patch(`/api/orders/shipments/${parcelId}/pickup-request`).set(auth(who));
  const confirm = (who = shop) => api().patch(`/api/orders/shipments/${parcelId}/pickup-confirm`).set(auth(who));
  const deny = (who = shop, reason) => api().patch(`/api/orders/shipments/${parcelId}/pickup-deny`).set(auth(who)).send({ reason });

  test('a courier asks for the parcel rather than simply taking it', async () => {
    const response = await request();
    expect(response.status).toBe(200);
    const [parcel] = await shipmentsOf(orderId);
    expect(parcel.status).toBe('pickup_requested');
    expect(parcel.courier_id).toBe(courier.courier_id);
  });

  test('a requested parcel leaves the pool for everyone else', async () => {
    await request();
    const other = await makeCourier();
    const response = await api().get('/api/orders/shipments/available').set(auth(other));
    expect(response.body.map((parcel) => parcel.id)).not.toContain(parcelId);
  });

  test('a second courier cannot ask for a parcel already spoken for', async () => {
    await request();
    const other = await makeCourier();
    const response = await request(other);
    expect(response.status).toBe(409);
  });

  test('a parcel the shop has not released cannot be requested', async () => {
    const product = await listProduct(shop);
    const order = await placeOrder(customer, [{ id: product.id }]);
    const [fresh] = await shipmentsOf(order.body.id);
    const response = await api().patch(`/api/orders/shipments/${fresh.id}/pickup-request`).set(auth(courier));
    expect(response.status).toBe(409);
  });

  test('an off-duty courier cannot ask for parcels', async () => {
    const offDuty = await makeCourier({ onShift: false });
    const response = await request(offDuty);
    expect(response.status).toBe(409);
  });

  test('the shop cannot request its own parcel', async () => {
    const response = await request(shop);
    expect(response.status).toBe(403);
  });

  test('the customer sees that a courier is on the way', async () => {
    await request();
    const response = await api().get(`/api/orders/${orderId}`).set(auth(customer));
    expect(response.body.shipments[0].status).toBe('pickup_requested');
    expect(response.body.tracking.map((event) => event.status)).toContain('pickup_requested');
  });

  test('the courier\'s details stay hidden until the handover is confirmed', async () => {
    await request();
    const response = await api().get(`/api/orders/${orderId}`).set(auth(customer));
    expect(response.body.shipments[0].contact_available).toBe(false);
    expect(response.body.shipments[0].driver_phone).toBeNull();
  });

  test('the shop confirms the handover and the parcel counts as collected', async () => {
    await request();
    const response = await confirm();
    expect(response.status).toBe(200);
    const [parcel] = await shipmentsOf(orderId);
    expect(parcel.status).toBe('picked_up');
  });

  test('once collected, the customer can contact the courier', async () => {
    await request();
    await confirm();
    const response = await api().get(`/api/orders/${orderId}`).set(auth(customer));
    expect(response.body.shipments[0].contact_available).toBe(true);
    expect(response.body.shipments[0].driver_name).toBe(courier.name);
  });

  test('a shop cannot confirm a handover nobody asked for', async () => {
    const response = await confirm();
    expect(response.status).toBe(409);
  });

  test('another shop cannot confirm this handover', async () => {
    const other = await makeSeller({ shop_name: 'Jets' });
    await request();
    const response = await confirm(other);
    expect(response.status).toBe(403);
  });

  test('the courier cannot confirm their own pickup', async () => {
    await request();
    const response = await api().patch(`/api/orders/shipments/${parcelId}/pickup-confirm`).set(auth(courier));
    expect(response.status).toBe(403);
  });

  test('"not picked up" puts the parcel back in the pool', async () => {
    await request();
    const response = await deny(shop, 'The rider never arrived');
    expect(response.status).toBe(200);

    const [parcel] = await shipmentsOf(orderId);
    expect(parcel.status).toBe('shipped');
    expect(parcel.courier_id).toBeNull();

    const other = await makeCourier();
    const pool_ = await api().get('/api/orders/shipments/available').set(auth(other));
    expect(pool_.body.map((item) => item.id)).toContain(parcelId);
  });

  test('the customer is told why the parcel is still waiting', async () => {
    await request();
    await deny(shop, 'The rider never arrived');
    const response = await api().get(`/api/orders/${orderId}`).set(auth(customer));
    const notes = response.body.tracking.map((event) => `${event.note || ''}`).join(' ');
    expect(notes).toMatch(/never arrived/i);
  });

  test('after a denial another courier can collect it', async () => {
    await request();
    await deny(shop, 'No show');
    const other = await makeCourier();
    const response = await request(other);
    expect(response.status).toBe(200);
    const [parcel] = await shipmentsOf(orderId);
    expect(parcel.courier_id).toBe(other.courier_id);
  });

  test('the shop is told which courier is asking, so it can check who it is handing to', async () => {
    await request();
    const response = await api().get('/api/orders').set(auth(shop));
    const waiting = response.body.find((order) => order.shipment_id === parcelId);
    expect(waiting.status).toBe('pickup_requested');
    expect(waiting.courier.driver_name).toBe(courier.name);
  });

  test('the customer is still not given the courier\'s number at that point', async () => {
    await request();
    const response = await api().get(`/api/orders/${orderId}`).set(auth(customer));
    expect(response.body.shipments[0].driver_phone).toBeNull();
    expect(response.body.shipments[0].contact_available).toBe(false);
  });

  test('a returned parcel leaves the courier, so their count goes back to zero', async () => {
    await request();
    const holding = await api().get('/api/orders').set(auth(courier));
    expect(holding.body.filter((order) => ['pickup_requested', 'picked_up'].includes(order.status))).toHaveLength(1);

    await deny(shop, 'No show');

    const afterwards = await api().get('/api/orders').set(auth(courier));
    expect(afterwards.body.filter((order) => ['pickup_requested', 'picked_up'].includes(order.status))).toHaveLength(0);
    expect(afterwards.body.some((order) => order.shipment_id === parcelId)).toBe(false);

    const shift = await api().get('/api/orders/courier/shift').set(auth(courier));
    expect(shift.body.carrying).toBe(0);
  });

  test('a courier whose parcel was returned can clock off again', async () => {
    await request();
    expect((await api().patch('/api/orders/courier/shift').set(auth(courier)).send({ on_shift: false })).status).toBe(409);

    await deny(shop, 'No show');
    expect((await api().patch('/api/orders/courier/shift').set(auth(courier)).send({ on_shift: false })).status).toBe(200);
  });

  test('only the shop can report a failed handover', async () => {
    await request();
    const response = await api().patch(`/api/orders/shipments/${parcelId}/pickup-deny`).set(auth(courier)).send({ reason: 'let me off' });
    expect(response.status).toBe(403);
  });
});

describe('Delivery and the customer\'s confirmation', () => {
  let shop;
  let customer;
  let courier;
  let orderId;
  let parcelId;

  beforeEach(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    customer = await makeCustomer();
    courier = await makeCourier();
    const product = await listProduct(shop);
    const order = await placeOrder(customer, [{ id: product.id }]);
    orderId = order.body.id;
    [{ id: parcelId }] = await shipmentsOf(orderId);
    await releaseParcel(shop, parcelId);
    await api().patch(`/api/orders/shipments/${parcelId}/pickup-request`).set(auth(courier));
    await api().patch(`/api/orders/shipments/${parcelId}/pickup-confirm`).set(auth(shop));
  });

  test('the courier carrying the parcel can mark it delivered', async () => {
    const response = await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(courier)).send({ status: 'delivered' });
    expect(response.status).toBe(200);
    const [parcel] = await shipmentsOf(orderId);
    expect(parcel.status).toBe('delivered');
  });

  test('a different courier cannot mark it delivered', async () => {
    const other = await makeCourier();
    const response = await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(other)).send({ status: 'delivered' });
    expect(response.status).toBe(403);
  });

  test('the shop still cannot mark it delivered', async () => {
    const response = await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(shop)).send({ status: 'delivered' });
    expect(response.status).toBe(403);
  });

  test('delivered is the end of the journey — there is no further confirmation to ask for', async () => {
    await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(courier)).send({ status: 'delivered' }).expect(200);

    const [parcel] = await shipmentsOf(orderId);
    expect(parcel.status).toBe('delivered');

    // The order as a whole follows its parcels straight to delivered.
    const order = await api().get(`/api/orders/${orderId}`).set(auth(customer));
    expect(order.body.status).toBe('delivered');
  });

  test('the customer sees it as delivered, with who brought it', async () => {
    await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(courier)).send({ status: 'delivered' });

    const feed = await api().get('/api/orders').set(auth(customer));
    const mine = feed.body.flatMap((order) => order.shipments || []).find((shipment) => shipment.id === parcelId);
    expect(mine.status).toBe('delivered');
    expect(mine.driver_name).toBe(courier.name);
    expect(mine.contact_available).toBe(true);
  });

  test('the old customer confirmation endpoint is gone', async () => {
    await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(courier)).send({ status: 'delivered' });
    const response = await api().patch(`/api/orders/shipments/${parcelId}/confirm-delivery`).set(auth(customer));
    expect(response.status).toBe(404);
  });
  test('a courier cannot clock off while still carrying a parcel', async () => {
    const response = await api().patch('/api/orders/courier/shift').set(auth(courier)).send({ on_shift: false });
    expect(response.status).toBe(409);
  });

  test('once everything is delivered the courier can clock off', async () => {
    await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(courier)).send({ status: 'delivered' });
    const response = await api().patch('/api/orders/courier/shift').set(auth(courier)).send({ on_shift: false });
    expect(response.status).toBe(200);
  });

  test('the courier sees only their own parcels in a shared order', async () => {
    const otherShop = await makeSeller({ shop_name: 'Jets' });
    const theirs = await listProduct(otherShop);
    const mine = await listProduct(shop);
    const order = await placeOrder(customer, [{ id: theirs.id }, { id: mine.id }]);
    const parcels = await shipmentsOf(order.body.id);
    const minesParcel = parcels.find((parcel) => parcel.seller_id === shop.profile_id);

    await releaseParcel(shop, minesParcel.id);
    await api().patch(`/api/orders/shipments/${minesParcel.id}/pickup-request`).set(auth(courier));
    await api().patch(`/api/orders/shipments/${minesParcel.id}/pickup-confirm`).set(auth(shop));

    const response = await api().get(`/api/orders/${order.body.id}`).set(auth(courier));
    expect(response.status).toBe(200);
    expect(response.body.shipments).toHaveLength(1);
    expect(response.body.shipments[0].id).toBe(minesParcel.id);
  });

  test('a parcel unclaimed for too long is given to an on-duty courier', async () => {
    const product = await listProduct(shop);
    const order = await placeOrder(customer, [{ id: product.id }]);
    const [stale] = await shipmentsOf(order.body.id);
    await releaseParcel(shop, stale.id);
    await pool.query('UPDATE shipments SET released_at = (CURRENT_TIMESTAMP - INTERVAL 2 HOUR) WHERE id = ?', [stale.id]);

    const Order = (await import('../../src/models/Order.js')).default;
    const escalated = await Order.escalateStaleParcels(60);
    expect(escalated.some((item) => item.shipment_id === stale.id)).toBe(true);
  });
});
