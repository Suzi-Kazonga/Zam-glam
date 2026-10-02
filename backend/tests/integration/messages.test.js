import {
  api, auth, pool, prepareDatabase, closeDatabase, makeSeller, makeCustomer, makeCourier,
} from '../helpers/harness.js';

describe('customer and shop messages', () => {
  let shop;
  let otherShop;
  let customer;
  let otherCustomer;
  let courier;

  beforeAll(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Mud Messages' });
    otherShop = await makeSeller({ shop_name: 'Jets Messages' });
    customer = await makeCustomer();
    otherCustomer = await makeCustomer();
    courier = await makeCourier({ approved: false });
  });

  afterAll(async () => closeDatabase());

  test('customer starts a thread with a shop and the seller can reply', async () => {
    const started = await api()
      .post(`/api/messages/threads/${shop.store_id}`)
      .set(auth(customer))
      .send({ body: 'Is the blue dress available in medium?' });
    expect(started.status).toBe(201);
    expect(started.body).toMatchObject({ sender_role: 'customer', body: 'Is the blue dress available in medium?' });

    const sellerThreads = await api().get('/api/messages/threads').set(auth(shop));
    expect(sellerThreads.status).toBe(200);
    expect(sellerThreads.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ customer_id: customer.profile_id, store_id: shop.store_id, last_sender_role: 'customer' }),
    ]));

    const reply = await api()
      .post(`/api/messages/threads/${shop.store_id}/${customer.profile_id}`)
      .set(auth(shop))
      .send({ body: 'Yes, medium is available.' });
    expect(reply.status).toBe(201);
    expect(reply.body).toMatchObject({ sender_role: 'seller', body: 'Yes, medium is available.' });

    const customerThreads = await api().get('/api/messages/threads').set(auth(customer));
    expect(customerThreads.body[0]).toMatchObject({ store_id: shop.store_id, last_sender_role: 'seller' });
    const history = await api().get(`/api/messages/threads/${shop.store_id}`).set(auth(customer));
    expect(history.body.map((message) => message.body)).toEqual([
      'Is the blue dress available in medium?',
      'Yes, medium is available.',
    ]);
  });

  test('seller cannot read or reply to another shop thread or an unstarted thread', async () => {
    expect((await api().get(`/api/messages/threads/${shop.store_id}/${otherCustomer.profile_id}`).set(auth(shop))).status).toBe(404);
    expect((await api().post(`/api/messages/threads/${otherShop.store_id}/${customer.profile_id}`).set(auth(shop)).send({ body: 'Hello' })).status).toBe(404);
    expect((await api().get(`/api/messages/threads/${shop.store_id}/${customer.profile_id}`).set(auth(otherShop))).status).toBe(404);
  });

  test('customers can only use their own session identity and couriers cannot access messages', async () => {
    expect((await api().get(`/api/messages/threads/${shop.store_id}/${customer.profile_id}`).set(auth(otherCustomer))).status).toBe(403);
    expect((await api().get('/api/messages/threads').set(auth(courier))).status).toBe(403);
  });

  test('messages must be present and within the size limit', async () => {
    expect((await api().post(`/api/messages/threads/${shop.store_id}`).set(auth(customer)).send({ body: '   ' })).status).toBe(400);
    expect((await api().post(`/api/messages/threads/${shop.store_id}`).set(auth(customer)).send({ body: 'x'.repeat(2001) })).status).toBe(400);
  });

  test('existing conversations remain readable after a shop closes but new ones cannot start', async () => {
    await pool.query("UPDATE stores SET status = 'closed' WHERE id = ?", [shop.store_id]);
    expect((await api().get(`/api/messages/threads/${shop.store_id}`).set(auth(customer))).status).toBe(200);
    expect((await api().post(`/api/messages/threads/${shop.store_id}`).set(auth(customer)).send({ body: 'Following up' })).status).toBe(201);

    await pool.query("UPDATE stores SET status = 'closed' WHERE id = ?", [otherShop.store_id]);
    expect((await api().post(`/api/messages/threads/${otherShop.store_id}`).set(auth(otherCustomer)).send({ body: 'Is the shop open?' })).status).toBe(404);
  });
});