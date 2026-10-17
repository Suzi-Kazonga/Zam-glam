import {
  api, auth, prepareDatabase, closeDatabase,
  makeCustomer, makeSeller, makeCourier, makeAdmin,
} from '../helpers/harness.js';

// Reporting a problem with Zamglam itself: who may report one, what the administrators
// see, and the count that drives the notification on the customer service button.

describe('Reporting a problem to the administrators', () => {
  let customer;
  let shop;
  let courier;
  let admin;

  beforeAll(async () => {
    await prepareDatabase();
    customer = await makeCustomer();
    shop = await makeSeller();
    courier = await makeCourier();
    admin = await makeAdmin();
  });

  afterAll(closeDatabase);

  test('a shopper can report a problem', async () => {
    const response = await api().post('/api/support/problems').set(auth(customer))
      .send({ message: 'The tracking page shows the wrong delivery date.' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('open');
  });

  test('a shop and a courier can report one too', async () => {
    await api().post('/api/support/problems').set(auth(shop))
      .send({ message: 'Uploading a fourth photograph fails silently.' }).expect(201);
    await api().post('/api/support/problems').set(auth(courier))
      .send({ message: 'The parcel list does not refresh after a delivery.' }).expect(201);
  });

  test('an empty message is refused', async () => {
    const response = await api().post('/api/support/problems').set(auth(customer)).send({ message: '   ' });
    expect(response.status).toBe(400);
  });

  test('signing in is required', async () => {
    const response = await api().post('/api/support/problems').send({ message: 'Anonymous' });
    expect(response.status).toBe(401);
  });

  test('an administrator files none — they clear them', async () => {
    const response = await api().post('/api/support/problems').set(auth(admin)).send({ message: 'Mine' });
    expect(response.status).toBe(403);
  });

  test('the administrator sees every report, with who sent it and their role', async () => {
    const response = await api().get('/api/support/problems').set(auth(admin));

    expect(response.status).toBe(200);
    expect(response.body.reports).toHaveLength(3);
    expect(response.body.reports.map((r) => r.reporter_role).sort()).toEqual(['courier', 'customer', 'seller']);
    expect(response.body.reports[0]).toMatchObject({ status: 'open', reporter_name: expect.any(String) });
  });

  test('the open count is what the notification shows', async () => {
    const response = await api().get('/api/support/problems/count').set(auth(admin));
    expect(response.body.open).toBe(3);
  });

  test('nobody but an administrator may read the queue', async () => {
    expect((await api().get('/api/support/problems').set(auth(customer))).status).toBe(403);
    expect((await api().get('/api/support/problems/count').set(auth(shop))).status).toBe(403);
  });

  test('a reporter can see what they themselves sent', async () => {
    const response = await api().get('/api/support/problems/mine').set(auth(courier));
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].message).toMatch(/parcel list/);
  });

  test('marking one done takes it off the queue and out of the count', async () => {
    const queue = await api().get('/api/support/problems').set(auth(admin));
    const first = queue.body.reports[0];

    const done = await api().patch(`/api/support/problems/${first.id}/done`).set(auth(admin));
    expect(done.status).toBe(200);
    expect(done.body.open).toBe(2);

    const after = await api().get('/api/support/problems').set(auth(admin));
    expect(after.body.reports.map((r) => r.id)).not.toContain(first.id);
    expect(after.body.reports).toHaveLength(2);
  });

  test('marking the same one done twice does not move the count', async () => {
    const all = await api().get('/api/support/problems?status=all').set(auth(admin));
    const alreadyDone = all.body.reports.find((r) => r.status === 'done');

    const again = await api().patch(`/api/support/problems/${alreadyDone.id}/done`).set(auth(admin));
    expect(again.status).toBe(200);
    expect(again.body.open).toBe(2);
  });

  test('a report that was cleared too soon can be reopened', async () => {
    const all = await api().get('/api/support/problems?status=all').set(auth(admin));
    const done = all.body.reports.find((r) => r.status === 'done');

    const reopened = await api().patch(`/api/support/problems/${done.id}/reopen`).set(auth(admin));
    expect(reopened.status).toBe(200);
    expect(reopened.body.open).toBe(3);
  });

  test('only an administrator can mark one done', async () => {
    const queue = await api().get('/api/support/problems').set(auth(admin));
    const response = await api().patch(`/api/support/problems/${queue.body.reports[0].id}/done`).set(auth(customer));
    expect(response.status).toBe(403);
  });

  test('a report that does not exist says so', async () => {
    const response = await api().patch('/api/support/problems/999999/done').set(auth(admin));
    expect(response.status).toBe(404);
  });
});
