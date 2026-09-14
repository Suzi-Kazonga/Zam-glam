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
      .field('audience', 'women')
      .field('category', 'clothes')
      .attach('images', onePixelPng, 'dress.png');

    expect(response.status).toBe(201);
    expect(response.body.product).toMatchObject({ name: 'Ankara Wrap Dress' });

    const created = await api().get(`/api/products/${response.body.product.id}`);
    created.body.images.forEach((image) => uploaded.push(image));
    expect(created.body.images.length).toBe(1);
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

  test('asking for a product that does not exist is a 404', async () => {
    expect((await api().get('/api/products/999999')).status).toBe(404);
  });

  test('the signed-in shop can find its own storefront', async () => {
    const response = await api().get('/api/stores/mine').set(auth(shop));
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(shop.store_id);
  });

  test('a shop with no storefront is told so rather than given someone else\'s', async () => {
    const storeless = await api().post('/api/auth/register').send({
      name: 'New Owner', email: `storeless${Date.now()}@zamglam.test`, password: 'SELLER123456', role: 'seller', shop_name: 'Storeless',
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

  test('only an admin can verify a shop', async () => {
    const response = await api()
      .patch(`/api/stores/verification/sellers/${shop.profile_id}`)
      .set(auth(otherShop))
      .send({ status: 'verified' });
    expect(response.status).toBe(403);
  });
});
