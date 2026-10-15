import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  api, auth, prepareDatabase, closeDatabase, makeSeller, makeCustomer, makeAdmin, listProduct,
} from '../helpers/harness.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

// A one pixel PNG, so the upload path can be exercised without a fixture file.
const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('The catalogue', () => {
  let shop;
  let otherShop;
  const uploaded = [];

  beforeAll(async () => {
    await prepareDatabase();
    shop = await makeSeller({ shop_name: 'Mud Test', location: 'Lusaka' });
    otherShop = await makeSeller({ shop_name: 'Jets Test', location: 'Kitwe' });
  });

  afterAll(async () => {
    // Listing through the API writes real files; leave the uploads folder as we found it.
    uploaded.forEach((file) => {
      const full = path.join(uploadsDir, path.basename(file));
      if (fs.existsSync(full)) fs.unlinkSync(full);
    });
    await closeDatabase();
  });

  test('the catalogue starts empty', async () => {
    const response = await api().get('/api/products');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('a shop can list a product, with photos', async () => {
    const response = await api()
      .post('/api/products')
      .set(auth(shop))
      .field('name', 'Ankara Wrap Dress')
      .field('price', '450')
      .field('stock', '5')
      .field('restock_expected_at', '2026-11-20')
      .field('audience', 'women')
      .field('category', 'clothes')
      .attach('images', onePixelPng, 'dress.png');

    expect(response.status).toBe(201);
    expect(response.body.product).toMatchObject({ name: 'Ankara Wrap Dress' });

    const created = await api().get(`/api/products/${response.body.product.id}`);
    created.body.images.forEach((image) => uploaded.push(image));
    expect(created.body.images.length).toBe(1);
    expect(new Date(created.body.restock_expected_at).toISOString().slice(0, 10)).toBe('2026-11-20');
    const image = await api().get(created.body.images[0]);
    expect(image.status).toBe(200);
    expect(image.headers['content-type']).toMatch(/^image\/png/);
  });

  test('a listing without a photo is refused', async () => {
    const response = await api()
      .post('/api/products')
      .set(auth(shop))
      .field('name', 'No Photo')
      .field('price', '100');
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/image/i);
  });

  test('a listing needs a name and a price', async () => {
    const response = await api()
      .post('/api/products')
      .set(auth(shop))
      .field('description', 'nothing else')
      .attach('images', onePixelPng, 'x.png');
    expect(response.status).toBe(400);
  });

  test('a shopper cannot list a product', async () => {
    const customer = await makeCustomer();
    const response = await api().post('/api/products').set(auth(customer)).field('name', 'Sneaky').field('price', '1');
    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/seller account/i);
  });

  test('listing a product needs a signed-in account', async () => {
    const response = await api().post('/api/products').field('name', 'Anonymous').field('price', '1');
    expect(response.status).toBe(401);
  });

  test('every product carries the name of the shop selling it', async () => {
    const response = await api().get('/api/products');
    expect(response.body.length).toBeGreaterThan(0);
    response.body.forEach((product) => expect(product.store_name).toEqual(expect.any(String)));
  });

  test('sizes and images come back as arrays, not raw text', async () => {
    const product = await listProduct(shop, { sizes: ['S', 'M', 'L'] });
    const response = await api().get(`/api/products/${product.id}`);
    expect(Array.isArray(response.body.sizes)).toBe(true);
    expect(response.body.sizes).toEqual(['S', 'M', 'L']);
    expect(Array.isArray(response.body.images)).toBe(true);
  });

  test('the catalogue can be filtered by who it is for', async () => {
    await listProduct(shop, { audience: 'men', name: 'Mens Shirt' });
    const response = await api().get('/api/products?audience=men');
    expect(response.body.length).toBeGreaterThan(0);
    response.body.forEach((product) => expect(product.audience).toBe('men'));
  });

  test('a storefront shows only that shop\'s products', async () => {
    await listProduct(otherShop, { name: 'Kitwe Jacket' });
    const response = await api().get(`/api/products?store_id=${shop.store_id}`);
    expect(response.body.length).toBeGreaterThan(0);
    response.body.forEach((product) => expect(product.store_id).toBe(shop.store_id));
  });

  test('a shop sees its own products and nobody else\'s', async () => {
    const response = await api().get('/api/products/seller/my-products').set(auth(shop));
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    const names = response.body.map((product) => product.name);
    expect(names).not.toContain('Kitwe Jacket');
  });

  test('a shop cannot edit another shop\'s product', async () => {
    const theirs = await listProduct(otherShop, { name: 'Not Yours' });
    const response = await api().put(`/api/products/${theirs.id}`).set(auth(shop)).field('price', '1');
    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/own store/i);
  });

  test('a shop cannot delete another shop\'s product', async () => {
    const theirs = await listProduct(otherShop, { name: 'Also Not Yours' });
    const response = await api().delete(`/api/products/${theirs.id}`).set(auth(shop));
    expect(response.status).toBe(403);
  });

  test('a shop can edit its own price without losing its photos', async () => {
    const mine = await listProduct(shop, { name: 'Repriced', price: 300 });
    const before = await api().get(`/api/products/${mine.id}`);
    await api().put(`/api/products/${mine.id}`).set(auth(shop)).field('price', '275').expect(200);
    const after = await api().get(`/api/products/${mine.id}`);
    expect(Number(after.body.price)).toBe(275);
    expect(after.body.images).toEqual(before.body.images);
  });

  test('a shop can add more angles to an existing product without replacing its photos', async () => {
    const product = await listProduct(shop, { name: 'Multi-view Dress' });
    const before = await api().get(`/api/products/${product.id}`);
    const response = await api()
      .put(`/api/products/${product.id}`)
      .set(auth(shop))
      .attach('images', onePixelPng, 'dress-side.png')
      .attach('images', onePixelPng, 'dress-back.png');
    expect(response.status).toBe(200);

    const after = await api().get(`/api/products/${product.id}`);
    after.body.images.filter((image) => !before.body.images.includes(image)).forEach((image) => uploaded.push(image));
    expect(after.body.images).toHaveLength(before.body.images.length + 2);
    expect(after.body.image_url).toBe(before.body.image_url);
    expect(after.body.images.slice(0, before.body.images.length)).toEqual(before.body.images);
  });

  test('a shop can update and clear a product restock date', async () => {
    const product = await listProduct(shop, { name: 'Restock date test', stock: 0 });
    await api().put(`/api/products/${product.id}`).set(auth(shop)).field('restock_expected_at', '2026-12-01').expect(200);
    const dated = await api().get(`/api/products/${product.id}`);
    expect(new Date(dated.body.restock_expected_at).toISOString().slice(0, 10)).toBe('2026-12-01');

    await api().put(`/api/products/${product.id}`).set(auth(shop)).field('restock_expected_at', '').expect(200);
    const cleared = await api().get(`/api/products/${product.id}`);
    expect(cleared.body.restock_expected_at).toBeNull();
  });

  test('a shop cannot save an invalid restock date', async () => {
    const product = await listProduct(shop, { name: 'Invalid restock date test' });
    const response = await api().put(`/api/products/${product.id}`).set(auth(shop)).field('restock_expected_at', '2026-02-31');
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/restock date/i);
  });

  test('asking for a product that does not exist is a 404', async () => {
    expect((await api().get('/api/products/999999')).status).toBe(404);
  });

  test('the signed-in shop can find its own storefront', async () => {
    const response = await api().get('/api/stores/mine').set(auth(shop));
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(shop.store_id);
  });

  test('a shop can switch its storefront on and off duty', async () => {
    const product = await listProduct(shop, { name: 'Off-duty listing', stock: 10 });
    const customer = await makeCustomer();
    await api().put(`/api/stores/${shop.store_id}`).set(auth(shop)).send({
      location: 'Kabulonga, Lusaka',
      open_hours: { open: '09:00', close: '18:00' },
    }).expect(200);
    const invalidHours = await api().put(`/api/stores/${shop.store_id}`).set(auth(shop)).send({
      open_hours: { open: '18:00', close: '09:00' },
    });
    expect(invalidHours.status).toBe(400);
    await api().put(`/api/stores/${shop.store_id}`).set(auth(shop)).send({ status: 'closed' }).expect(200);
    const closed = await api().get('/api/stores/mine').set(auth(shop));
    expect(closed.body.status).toBe('closed');
    expect(closed.body.location).toBe('Kabulonga, Lusaka');
    const savedHours = typeof closed.body.open_hours === 'string' ? JSON.parse(closed.body.open_hours) : closed.body.open_hours;
    expect(savedHours).toMatchObject({ open: '09:00', close: '18:00' });

    const catalogue = await api().get('/api/products');
    expect(catalogue.body.some((item) => item.id === product.id)).toBe(false);
    expect((await api().get(`/api/products/${product.id}`)).status).toBe(404);
    expect((await api().get(`/api/stores/${shop.store_id}/products`)).body).toEqual([]);
    const addToCart = await api().post('/api/cart').set(auth(customer)).send({ product_id: product.id, quantity: 1 });
    expect(addToCart.status).toBe(409);
    const orderQuote = await api().post('/api/orders/quote').set(auth(customer)).send({ items: [{ product_id: product.id, quantity: 1 }], location: 'Lusaka' });
    expect(orderQuote.status).toBe(409);

    const invalid = await api().put(`/api/stores/${shop.store_id}`).set(auth(shop)).send({ status: 'paused' });
    expect(invalid.status).toBe(400);

    await api().put(`/api/stores/${shop.store_id}`).set(auth(shop)).send({ status: 'open' }).expect(200);
    const opened = await api().get('/api/stores/mine').set(auth(shop));
    expect(opened.body.status).toBe('open');
  });

  test('a shop with no storefront is told so rather than given someone else\'s', async () => {
    const storeless = await api().post('/api/auth/register').send({
      name: 'New Owner', email: `storeless${Date.now()}@zamglam.test`, password: 'SELLER123456', role: 'seller', shop_name: 'Storeless', accepted_terms: true,
    });
    const response = await api().get('/api/stores/mine').set('Authorization', `Bearer ${storeless.body.token}`);
    expect(response.status).toBe(404);
  });

  test('a new shop starts unverified and an admin can verify it', async () => {
    const admin = await makeAdmin();
    const queue = await api().get('/api/stores/verification/sellers').set(auth(admin));
    expect(queue.status).toBe(200);
    const waiting = queue.body.find((seller) => seller.id === shop.profile_id);
    expect(waiting.verification_status).toBe('pending');

    const decided = await api()
      .patch(`/api/stores/verification/sellers/${shop.profile_id}`)
      .set(auth(admin))
      .send({ status: 'verified' });
    expect(decided.status).toBe(200);

    const listed = await api().get(`/api/products?store_id=${shop.store_id}`);
    expect(listed.body[0].store_verification).toBe('verified');
  });

  test('a suspended shop is marked unavailable on its products and its storefront', async () => {
    const admin = await makeAdmin();
    await api()
      .patch(`/api/reports/admin/seller/${otherShop.profile_id}/status`)
      .set(auth(admin))
      .send({ status: 'suspended', reason: 'Repeated complaints' })
      .expect(200);

    const listed = await api().get(`/api/products?store_id=${otherShop.store_id}`);
    expect(listed.body.length).toBeGreaterThan(0);
    listed.body.forEach((product) => expect(product.store_status).toBe('suspended'));

    const storefront = await api().get(`/api/stores/${otherShop.store_id}`);
    expect(storefront.body.account_status).toBe('suspended');

    // A shop in good standing is not marked, so the badge stays meaningful.
    const mine = await api().get(`/api/products?store_id=${shop.store_id}`);
    mine.body.forEach((product) => expect(product.store_status).not.toBe('suspended'));
  });

  test('only an admin can verify a shop', async () => {
    const response = await api()
      .patch(`/api/stores/verification/sellers/${shop.profile_id}`)
      .set(auth(otherShop))
      .send({ status: 'verified' });
    expect(response.status).toBe(403);
  });
});
