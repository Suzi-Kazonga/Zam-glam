import {
  api, auth, pool, prepareDatabase, closeDatabase,
  makeSeller, makeCustomer, makeAdmin, listProduct, placeOrder, shipmentsOf,
} from '../helpers/harness.js';

afterAll(closeDatabase);

describe('Refund request review', () => {
  let seller;
  let customer;
  let admin;
  let shipment;

  beforeEach(async () => {
    await prepareDatabase();
    seller = await makeSeller({ shop_name: 'Refund Test Shop', location: 'Lusaka' });
    customer = await makeCustomer();
    admin = await makeAdmin();
    const product = await listProduct(seller);
    const order = await placeOrder(customer, [{ id: product.id }]);
    [shipment] = await shipmentsOf(order.body.id);
  });

  const openRequest = (actor = customer) => api()
    .post('/api/refunds')
    .set(auth(actor))
    .send({ shipment_id: shipment.id, reason: 'Wrong or missing item', details: 'The parcel contained the wrong size.' });

  test('requires a signed-in customer and only allows requests after delivery', async () => {
    const signedOut = await api().post('/api/refunds').send({ shipment_id: shipment.id, reason: 'Other', details: 'Not signed in' });
    expect(signedOut.status).toBe(401);

    const tooEarly = await openRequest();
    expect(tooEarly.status).toBe(409);

    await pool.query("UPDATE shipments SET status = 'delivered' WHERE id = ?", [shipment.id]);
    const created = await openRequest();
    expect(created.status).toBe(201);
    expect(created.body.refund.status).toBe('seller_review');
  });

  test('customer and seller discuss the case, then only admin can make the final decision', async () => {
    await pool.query("UPDATE shipments SET status = 'delivered' WHERE id = ?", [shipment.id]);
    const created = await openRequest();
    expect(created.status).toBe(201);
    const refundId = created.body.refund.id;

    const stranger = await makeCustomer();
    const hiddenCase = await api().get(`/api/refunds/${refundId}`).set(auth(stranger));
    expect(hiddenCase.status).toBe(403);

    const sellerMessage = await api().post(`/api/refunds/${refundId}/messages`).set(auth(seller)).send({ body: 'Please share a photo of the label.' });
    expect(sellerMessage.status).toBe(200);
    const customerMessage = await api().post(`/api/refunds/${refundId}/messages`).set(auth(customer)).send({ body: 'I have attached the label details.' });
    expect(customerMessage.status).toBe(200);

    const prematureDecision = await api().patch(`/api/refunds/admin/${refundId}/decision`).set(auth(admin)).send({ decision: 'approved', note: 'Inspected' });
    expect(prematureDecision.status).toBe(409);

    const recommendation = await api().patch(`/api/refunds/${refundId}/recommendation`).set(auth(seller)).send({ recommendation: 'approve', note: 'The wrong size was packed.' });
    expect(recommendation.status).toBe(200);
    expect(recommendation.body.status).toBe('admin_review');

    const noAdminAccess = await api().get('/api/refunds/admin').set(auth(customer));
    expect(noAdminAccess.status).toBe(403);

    const decision = await api().patch(`/api/refunds/admin/${refundId}/decision`).set(auth(admin)).send({ decision: 'approved', note: 'Evidence supports the request.' });
    expect(decision.status).toBe(200);
    expect(decision.body.refund.status).toBe('approved');
    expect(decision.body.message).toMatch(/No payment has been transferred/);
    expect(decision.body.refund.messages).toHaveLength(4);

    const closedDiscussion = await api().post(`/api/refunds/${refundId}/messages`).set(auth(customer)).send({ body: 'Follow-up' });
    expect(closedDiscussion.status).toBe(409);
  });

  test('prevents another request for a parcel and rejects non-customer submissions', async () => {
    await pool.query("UPDATE shipments SET status = 'delivered' WHERE id = ?", [shipment.id]);
    const stranger = await makeCustomer();
    const otherCustomer = await openRequest(stranger);
    expect(otherCustomer.status).toBe(403);

    const first = await openRequest();
    expect(first.status).toBe(201);
    const duplicate = await openRequest();
    expect(duplicate.status).toBe(409);

    const sellerSubmission = await api().post('/api/refunds').set(auth(seller)).send({
      shipment_id: shipment.id,
      reason: 'Other',
      details: 'Seller cannot open the customer case.',
    });
    expect(sellerSubmission.status).toBe(403);
  });
});
