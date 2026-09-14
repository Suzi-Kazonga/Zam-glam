import {
  api, auth, pool, prepareDatabase, closeDatabase,
  makeSeller, makeCustomer, makeCourier, makeAdmin, listProduct, placeOrder, shipmentsOf,
} from '../helpers/harness.js';

// One pool serves the whole file, so it is closed once, after every group has finished.
afterAll(closeDatabase);

describe('Placing an order across several shops', () => {
  let mud;
  let jets;
  let customer;
  let dress;
  let jacket;
  let shoes;

  beforeAll(async () => {
    await prepareDatabase();
    mud = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    jets = await makeSeller({ shop_name: 'Jets', location: 'Kitwe' });
    customer = await makeCustomer({ location: 'Lusaka' });
    dress = await listProduct(mud, { name: 'Wrap Dress', price: 450, stock: 10 });
    jacket = await listProduct(mud, { name: 'Denim Jacket', price: 600, stock: 4 });
    shoes = await listProduct(jets, { name: 'Canvas Shoes', price: 320, stock: 2 });
  });


  test('a basket can be priced before it is placed', async () => {
    const response = await api().post('/api/orders/quote').set(auth(customer)).send({
      items: [{ product_id: dress.id, quantity: 2 }, { product_id: shoes.id, quantity: 1 }],
      location: 'Lusaka',
    });

    expect(response.status).toBe(200);
    expect(response.body.items_total).toBe(450 * 2 + 320);
    expect(response.body.total).toBe(response.body.items_total + response.body.delivery_total);
  });

  test('the quote is one parcel per shop, each with its own delivery fee', async () => {
    const response = await api().post('/api/orders/quote').set(auth(customer)).send({
      items: [{ product_id: dress.id, quantity: 1 }, { product_id: shoes.id, quantity: 1 }],
      location: 'Lusaka',
    });

    expect(response.body.parcels).toHaveLength(2);
    response.body.parcels.forEach((parcel) => {
      expect(parcel.delivery_fee).toBeGreaterThan(0);
      expect(parcel.store_name).toEqual(expect.any(String));
    });
    const fees = response.body.parcels.reduce((total, parcel) => total + parcel.delivery_fee, 0);
    expect(response.body.delivery_total).toBe(fees);
  });

  test('a parcel from further away costs more to deliver', async () => {
    const response = await api().post('/api/orders/quote').set(auth(customer)).send({
      items: [{ product_id: dress.id, quantity: 1 }, { product_id: shoes.id, quantity: 1 }],
      location: 'Lusaka',
    });
    const fromLusaka = response.body.parcels.find((parcel) => parcel.store_name === 'Mud');
    const fromKitwe = response.body.parcels.find((parcel) => parcel.store_name === 'Jets');
    expect(fromKitwe.delivery_fee).toBeGreaterThan(fromLusaka.delivery_fee);
  });

  test('placing an order splits it into one parcel per shop', async () => {
    const response = await placeOrder(customer, [
      { id: dress.id, quantity: 1 },
      { id: jacket.id, quantity: 1 },
      { id: shoes.id, quantity: 1 },
    ]);

    expect(response.status).toBe(201);
    const parcels = await shipmentsOf(response.body.id);
    // Two shops, three items: Mud's two items travel together.
    expect(parcels).toHaveLength(2);
    expect(new Set(parcels.map((parcel) => parcel.seller_id)).size).toBe(2);
  });

  test('every parcel starts at placed', async () => {
    const order = await placeOrder(customer, [{ id: dress.id, quantity: 1 }]);
    const parcels = await shipmentsOf(order.body.id);
    expect(parcels.every((parcel) => parcel.status === 'placed')).toBe(true);
  });

  test('no courier is attached until one takes the parcel', async () => {
    const order = await placeOrder(customer, [{ id: dress.id, quantity: 1 }]);
    const parcels = await shipmentsOf(order.body.id);
    expect(parcels[0].courier_id).toBeNull();
  });

  test('placing an order takes the stock off the shelf', async () => {
    const before = await api().get(`/api/products/${jacket.id}`);
    await placeOrder(customer, [{ id: jacket.id, quantity: 2 }]);
    const after = await api().get(`/api/products/${jacket.id}`);
    expect(after.body.stock).toBe(before.body.stock - 2);
  });

  test('an order for more than the shop has is refused', async () => {
    const response = await placeOrder(customer, [{ id: shoes.id, quantity: 999 }]);
    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/stock/i);
  });

  test('a refused order changes no stock', async () => {
    const before = await api().get(`/api/products/${shoes.id}`);
    await placeOrder(customer, [{ id: shoes.id, quantity: 999 }]);
    const after = await api().get(`/api/products/${shoes.id}`);
    expect(after.body.stock).toBe(before.body.stock);
  });

  test('an order for a product that does not exist is refused', async () => {
    const response = await placeOrder(customer, [{ id: 999999, quantity: 1 }]);
    expect(response.status).toBe(404);
  });

  test('an empty basket is refused', async () => {
    const response = await placeOrder(customer, []);
    expect(response.status).toBe(400);
  });

  test('ordering needs a signed-in account', async () => {
    const response = await api().post('/api/orders').send({ items: [{ product_id: dress.id, quantity: 1 }] });
    expect(response.status).toBe(401);
  });

  test('the charged total matches what the quote showed', async () => {
    const items = [{ product_id: dress.id, quantity: 1 }, { product_id: shoes.id, quantity: 1 }];
    const quote = await api().post('/api/orders/quote').set(auth(customer)).send({ items, location: 'Lusaka' });
    const order = await placeOrder(customer, items.map((item) => ({ id: item.product_id, quantity: item.quantity })));

    const [rows] = await pool.query('SELECT total_price, items_total, delivery_total FROM orders WHERE id = ?', [order.body.id]);
    expect(Number(rows[0].total_price)).toBe(quote.body.total);
    expect(Number(rows[0].items_total)).toBe(quote.body.items_total);
    expect(Number(rows[0].delivery_total)).toBe(quote.body.delivery_total);
  });
});

describe('Who can see an order', () => {
  let mud;
  let jets;
  let customer;
  let stranger;
  let orderId;

  beforeAll(async () => {
    await prepareDatabase();
    mud = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    jets = await makeSeller({ shop_name: 'Jets', location: 'Lusaka' });
    customer = await makeCustomer();
    stranger = await makeCustomer();
    const fromMud = await listProduct(mud, { name: 'Mud Dress' });
    const fromJets = await listProduct(jets, { name: 'Jets Shoes' });
    const order = await placeOrder(customer, [{ id: fromMud.id }, { id: fromJets.id }]);
    orderId = order.body.id;
  });


  test('the customer who placed it sees the whole order', async () => {
    const response = await api().get(`/api/orders/${orderId}`).set(auth(customer));
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.shipments).toHaveLength(2);
  });

  test('another shopper cannot open it', async () => {
    const response = await api().get(`/api/orders/${orderId}`).set(auth(stranger));
    expect(response.status).toBe(403);
  });

  test('reading an order needs a signed-in account', async () => {
    expect((await api().get(`/api/orders/${orderId}`)).status).toBe(401);
  });

  test('a shop sees only its own line in a shared order', async () => {
    const response = await api().get(`/api/orders/${orderId}`).set(auth(mud));
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].name).toBe('Mud Dress');
    expect(response.body.shipments).toHaveLength(1);
  });

  test('an admin sees everything', async () => {
    const admin = await makeAdmin();
    const response = await api().get(`/api/orders/${orderId}`).set(auth(admin));
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
  });

  test('a courier with nothing to do with the order cannot open it', async () => {
    const courier = await makeCourier();
    const response = await api().get(`/api/orders/${orderId}`).set(auth(courier));
    expect(response.status).toBe(403);
  });

  test('the customer\'s own list shows the order', async () => {
    const response = await api().get('/api/orders').set(auth(customer));
    expect(response.status).toBe(200);
    expect(response.body.some((order) => order.id === orderId)).toBe(true);
  });

  test('a shop\'s list shows orders containing its products', async () => {
    const response = await api().get('/api/orders').set(auth(mud));
    expect(response.body.some((order) => order.id === orderId)).toBe(true);
  });

  test('an order that does not exist is a 404, not a 403', async () => {
    const response = await api().get('/api/orders/999999').set(auth(customer));
    expect(response.status).toBe(404);
  });
});

describe('Moving a parcel through its stages', () => {
  let shop;
  let customer;
  let orderId;
  let parcelId;

  beforeEach(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Mud', location: 'Lusaka' });
    customer = await makeCustomer();
    const product = await listProduct(shop);
    const order = await placeOrder(customer, [{ id: product.id }]);
    orderId = order.body.id;
    [{ id: parcelId }] = await shipmentsOf(orderId);
  });


  test('the shop can start packing its parcel', async () => {
    const response = await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(shop)).send({ status: 'processing' });
    expect(response.status).toBe(200);
    const [parcel] = await shipmentsOf(orderId);
    expect(parcel.status).toBe('processing');
  });

  test('the order follows its least advanced parcel', async () => {
    await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(shop)).send({ status: 'processing' });
    const order = await api().get(`/api/orders/${orderId}`).set(auth(customer));
    expect(order.body.status).toBe('processing');
  });

  test('the customer cannot move their own parcel along', async () => {
    const response = await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(customer)).send({ status: 'shipped' });
    expect(response.status).toBe(403);
  });

  test('another shop cannot touch this parcel', async () => {
    const other = await makeSeller({ shop_name: 'Jets' });
    const response = await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(other)).send({ status: 'shipped' });
    expect(response.status).toBe(403);
  });

  test('a made-up status is refused', async () => {
    const response = await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(shop)).send({ status: 'teleported' });
    expect(response.status).toBe(400);
  });

  test('the shop cannot declare its own parcel delivered', async () => {
    const response = await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(shop)).send({ status: 'delivered' });
    expect(response.status).toBe(403);
  });

  test('a parcel cannot jump from the shelf to delivered', async () => {
    const courier = await makeCourier();
    const admin = await makeAdmin();
    const response = await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(admin)).send({ status: 'delivered' });
    expect(response.status).toBe(409);
    expect(courier.token).toEqual(expect.any(String));
  });

  test('releasing a parcel records when it went into the pool', async () => {
    await api().patch(`/api/orders/shipments/${parcelId}/status`).set(auth(shop)).send({ status: 'shipped' }).expect(200);
    const [parcel] = await shipmentsOf(orderId);
    expect(parcel.released_at).not.toBeNull();
  });
});
