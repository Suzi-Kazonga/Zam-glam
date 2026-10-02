import {
  api, auth, prepareDatabase, closeDatabase, makeSeller, makeCourier, makeCustomer, listProduct, placeOrder,
} from '../helpers/harness.js';

describe('seller promotions', () => {
  let shop;
  let otherShop;
  let product;

  beforeAll(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Promotion Shop' });
    otherShop = await makeSeller({ shop_name: 'Other Promotion Shop' });
    product = await listProduct(shop, { name: 'Promo Jacket', price: 200 });
  });

  afterAll(async () => closeDatabase());

  test('seller can publish a scheduled promotion and it appears in the existing deals contract', async () => {
    const startsAt = new Date(Date.now() - 60_000).toISOString();
    const endsAt = new Date(Date.now() + 60 * 60_000).toISOString();
    const created = await api().post('/api/deals/mine').set(auth(shop)).send({
      product_id: product.id,
      discount_percent: 25,
      featured: true,
      starts_at: startsAt,
      ends_at: endsAt,
    });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ product_id: product.id, product_name: 'Promo Jacket', discount_percent: 25 });

    const publicDeals = await api().get('/api/deals');
    const deal = publicDeals.body.find((row) => row.product_id === product.id);
    expect(deal).toMatchObject({ id: product.id, price: 200, sale_price: 150 });
    expect(new Date(deal.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  test('seller promotion list and delete are scoped to the signed-in shop', async () => {
    const listed = await api().get('/api/deals/mine').set(auth(shop));
    expect(listed.status).toBe(200);
    expect(listed.body).toEqual(expect.arrayContaining([expect.objectContaining({ product_name: 'Promo Jacket' })]));

    const promotion = listed.body.find((row) => row.product_id === product.id);
    const denied = await api().delete(`/api/deals/mine/${promotion.id}`).set(auth(otherShop));
    expect(denied.status).toBe(404);
  });

  test('couriers and customers cannot view or manage seller promotions', async () => {
    const courier = await makeCourier({ approved: false });
    const customer = await makeCustomer();
    for (const account of [courier, customer]) {
      expect((await api().get('/api/deals/mine').set(auth(account))).status).toBe(403);
      expect((await api().post('/api/deals/mine').set(auth(account)).send({})).status).toBe(403);
    }
  });

  test('seller cannot create promotions for another shop product', async () => {
    const theirs = await listProduct(otherShop, { name: 'Private Product' });
    const response = await api().post('/api/deals/mine').set(auth(shop)).send({
      product_id: theirs.id,
      discount_percent: 10,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(response.status).toBe(404);
  });

  test('seller order tracker data omits customer addresses and contact details', async () => {
    const customer = await makeCustomer({ address: 'Private customer address', phone: '0970000000' });
    await placeOrder(customer, [{ id: product.id, quantity: 1 }]);
    const response = await api().get('/api/orders').set(auth(shop));

    expect(response.status).toBe(200);
    expect(response.body[0]).not.toHaveProperty('address');
    expect(response.body[0]).not.toHaveProperty('location');
    expect(response.body[0]).not.toHaveProperty('phone');
    expect(response.body[0]).not.toHaveProperty('customer_email');
  });

  test('store contact details save for the seller but stay out of public store data', async () => {
    const updated = await api().put(`/api/stores/${shop.store_id}`).set(auth(shop)).send({
      contact_email: 'shop-contact@zamglam.test',
      contact_phone: '+260 97 123 4567',
    });
    expect(updated.status).toBe(200);

    const mine = await api().get('/api/stores/mine').set(auth(shop));
    expect(mine.body).toMatchObject({
      contact_email: 'shop-contact@zamglam.test',
      contact_phone: '+260 97 123 4567',
    });

    const publicStore = await api().get(`/api/stores/${shop.store_id}`);
    expect(publicStore.body).not.toHaveProperty('contact_email');
    expect(publicStore.body).not.toHaveProperty('contact_phone');
  });
});