import {
  api, auth, prepareDatabase, closeDatabase,
  makeSeller, makeCustomer, makeCourier, listProduct, placeOrder, shipmentsOf, releaseParcel,
} from '../helpers/harness.js';

// The Details button on a shop's order: who the parcel is for, and who is carrying it.
// The order list leaves contact details out, so this is the one place a shop reads them,
// one parcel at a time and only for its own.

describe('A shop reading the details of one of its parcels', () => {
  let shop;
  let otherShop;
  let customer;
  let courier;
  let parcelId;

  beforeAll(async () => {
    await prepareDatabase();
    shop = await makeSeller();
    otherShop = await makeSeller();
    customer = await makeCustomer({ name: 'Chanda Banda', phone: '+260 97 111 2222' });
    courier = await makeCourier({ name: 'Mwansa Phiri' });

    const product = await listProduct(shop);
    const order = await placeOrder(customer, [{ id: product.id }], { address: 'Plot 12, Kabulonga Road', location: 'Lusaka', phone: '+260 97 111 2222' });
    [{ id: parcelId }] = await shipmentsOf(order.body.id);
  });

  afterAll(closeDatabase);

  const details = (who = shop) => api().get(`/api/orders/shipments/${parcelId}/details`).set(auth(who));

  test('shows who the parcel is for, and where it is going', async () => {
    const response = await details();

    expect(response.status).toBe(200);
    expect(response.body.customer).toMatchObject({
      name: 'Chanda Banda',
      phone: '+260 97 111 2222',
      address: 'Plot 12, Kabulonga Road',
      location: 'Lusaka',
    });
    expect(response.body.customer.email).toEqual(expect.any(String));
  });

  test('has no courier to show before anybody has taken the parcel on', async () => {
    const response = await details();
    expect(response.body.courier).toBeNull();
  });

  test('shows the courier once one has asked to collect it', async () => {
    await releaseParcel(shop, parcelId).expect(200);
    await api().patch(`/api/orders/shipments/${parcelId}/pickup-request`).set(auth(courier)).expect(200);

    const response = await details();
    expect(response.body.courier).toMatchObject({ name: 'Mwansa Phiri' });
    expect(response.body.status).toBe('pickup_requested');
  });

  test('another shop cannot read them', async () => {
    const response = await details(otherShop);
    expect(response.status).toBe(404);
    expect(response.body.customer).toBeUndefined();
  });

  test('neither the customer nor a courier reads them through this route', async () => {
    expect((await details(customer)).status).toBe(403);
    expect((await details(courier)).status).toBe(403);
  });

  test('signing in is required', async () => {
    const response = await api().get(`/api/orders/shipments/${parcelId}/details`);
    expect(response.status).toBe(401);
  });
});
