import {
  api, auth, prepareDatabase, closeDatabase, makeSeller, makeCustomer,
} from '../helpers/harness.js';

// What counts as unread in a conversation: what the other side has sent that has not
// been opened. It is what the counter beside the chat button shows.

describe('Unread messages', () => {
  let shop;
  let customer;

  beforeAll(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Unread Mud' });
    customer = await makeCustomer({ name: 'Chanda Banda' });
  });

  afterAll(closeDatabase);

  const threadOf = async (who) => {
    const response = await api().get('/api/messages/threads').set(auth(who));
    return response.body.find((thread) => thread.store_id === shop.store_id);
  };
  const customerSends = (body) => api().post(`/api/messages/threads/${shop.store_id}`).set(auth(customer)).send({ body });
  const shopSends = (body) => api().post(`/api/messages/threads/${shop.store_id}/${customer.profile_id}`).set(auth(shop)).send({ body });
  const shopOpens = (query = '') => api().get(`/api/messages/threads/${shop.store_id}/${customer.profile_id}${query}`).set(auth(shop));
  const customerOpens = () => api().get(`/api/messages/threads/${shop.store_id}`).set(auth(customer));

  test('a new message is unread for the one who received it, not the one who sent it', async () => {
    await customerSends('Is the blue dress in medium?').expect(201);
    await customerSends('And in large?').expect(201);

    expect(Number((await threadOf(shop)).unread_count)).toBe(2);
    expect(Number((await threadOf(customer)).unread_count)).toBe(0);
  });

  test('each conversation names the other side and carries the last message', async () => {
    const forShop = await threadOf(shop);
    expect(forShop.customer_name).toBe('Chanda Banda');
    expect(forShop.last_message).toBe('And in large?');

    const forCustomer = await threadOf(customer);
    expect(forCustomer.store_name).toEqual(expect.any(String));
    expect(forCustomer.last_message).toBe('And in large?');
  });

  test('a look without opening leaves it unread', async () => {
    await shopOpens('?peek=1').expect(200);
    expect(Number((await threadOf(shop)).unread_count)).toBe(2);
  });

  test('opening the conversation reads it', async () => {
    await shopOpens().expect(200);
    expect(Number((await threadOf(shop)).unread_count)).toBe(0);
  });

  test('a reply is unread for the customer until they open it', async () => {
    await shopSends('Yes, both sizes are in.').expect(201);
    expect(Number((await threadOf(customer)).unread_count)).toBe(1);
    // The shop's own reply is never unread for the shop.
    expect(Number((await threadOf(shop)).unread_count)).toBe(0);

    await customerOpens().expect(200);
    expect(Number((await threadOf(customer)).unread_count)).toBe(0);
  });
});
