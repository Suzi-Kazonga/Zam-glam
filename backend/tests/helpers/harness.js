import request from 'supertest';
import app from '../../src/app.js';
import { pool, initializeDatabase } from '../../src/config/db.js';
import Product from '../../src/models/Product.js';
import Store from '../../src/models/Store.js';
import User from '../../src/models/User.js';
import { resolveSellerId, resolveCustomerId, resolveCourierId } from '../../src/utils/accounts.js';

// Everything the suites need to talk to the real application: the same Express app the
// server runs, against a real (test) database with the real migrations applied. Nothing
// here re-implements a rule — if a check is wrong in src, these tests fail.

export { app, pool };
export const api = () => request(app);

let prepared = false;

export async function prepareDatabase() {
  if (!prepared) {
    await initializeDatabase();
    prepared = true;
  }
  await resetDatabase();
}

// Emptied in dependency order, with the foreign keys switched off so the order of this
// list can never become the reason a suite fails.
const TABLES = [
  'reports', 'order_status_history', 'payments', 'courier', 'shipments', 'order_items',
  'orders', 'cart', 'reviews', 'documents', 'products', 'stores', 'categories',
  'couriers', 'sellers', 'customers', 'admins', 'users',
];

export async function resetDatabase() {
  // All of this must run on ONE connection: SET FOREIGN_KEY_CHECKS is per-session, so on a
  // pool the TRUNCATEs can land on a different connection that still has the checks on.
  // lock_wait_timeout also defaults to a year, so a TRUNCATE that blocks does not fail —
  // it hangs the whole run. Bounding it turns that into a quick, readable error.
  const connection = await pool.getConnection();
  try {
    await connection.query('SET SESSION lock_wait_timeout = 30');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of TABLES) {
      try {
        await connection.query(`TRUNCATE TABLE ${table}`);
      } catch (error) {
        // A table an older schema never created is not a failure.
        if (error.code !== 'ER_NO_SUCH_TABLE') throw error;
      }
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    connection.release();
  }
}

export async function closeDatabase() {
  await pool.end();
}

let counter = 0;
const unique = (prefix) => `${prefix}${Date.now()}${(counter += 1)}`;

// --- Accounts -------------------------------------------------------------------

// Two account shapes exist (a central users table, or the role tables holding the login),
// so a test must never assume which one it is looking at. Every id a test uses comes back
// through the same resolvers the application itself uses.
const RESOLVER = { seller: resolveSellerId, customer: resolveCustomerId, courier: resolveCourierId };

export async function profileIdFor(role, email) {
  const account = await User.findByEmail(email);
  if (!account) return null;
  return RESOLVER[role] ? RESOLVER[role](account.id) : account.id;
}

async function registerAndSignIn(payload) {
  // accepted_terms is sent unless a test sets it, as the sign-up forms always do.
  const registered = await api().post('/api/auth/register').send({ accepted_terms: true, ...payload });
  if (registered.status !== 201) {
    throw new Error(`Could not register ${payload.role}: ${registered.status} ${JSON.stringify(registered.body)}`);
  }
  return {
    ...payload,
    id: registered.body.user.id,
    profile_id: await profileIdFor(payload.role, payload.email),
    token: registered.body.token,
  };
}

export function makeCustomer(overrides = {}) {
  return registerAndSignIn({
    name: 'Test Customer',
    email: `${unique('customer')}@zamglam.test`,
    password: 'CUSTOMER123456',
    role: 'customer',
    phone: '+260 97 000 0001',
    address: 'Kabulonga, Lusaka',
    location: 'Lusaka',
    ...overrides,
  });
}

// A seller with a storefront, which is what makes them able to list anything.
export async function makeSeller(overrides = {}) {
  const seller = await registerAndSignIn({
    name: 'Test Shop Owner',
    email: `${unique('seller')}@zamglam.test`,
    password: 'SELLER123456',
    role: 'seller',
    shop_name: overrides.shop_name || unique('Shop '),
    phone: '+260 97 000 0002',
    ...overrides,
  });

  const store = await api()
    .post('/api/stores')
    .set('Authorization', `Bearer ${seller.token}`)
    .send({ name: seller.shop_name, description: 'A test shop', location: overrides.location || 'Lusaka' });

  return { ...seller, store_id: store.body?.store?.id, seller_id: store.body?.store?.seller_id };
}

// New couriers wait for approval, so most tests want one that has been let in.
export async function makeCourier({ approved = true, onShift = true, ...overrides } = {}) {
  const courier = await registerAndSignIn({
    name: 'Test Rider',
    email: `${unique('courier')}@zamglam.test`,
    password: 'COURIER123456',
    role: 'courier',
    phone: '+260 97 000 0003',
    ...overrides,
  });

  if (approved) {
    await pool.query(
      "UPDATE couriers SET approval_status = 'approved', approved_at = CURRENT_TIMESTAMP, is_active = 1 WHERE id = ?",
      [courier.profile_id],
    );
    if (onShift) {
      await api().patch('/api/orders/courier/shift').set('Authorization', `Bearer ${courier.token}`).send({ on_shift: true });
    }
  }

  return { ...courier, courier_id: courier.profile_id };
}

export async function makeAdmin() {
  const email = `${unique('admin')}@zamglam.test`;
  await User.create({ name: 'Test Admin', email, password: 'ADMIN123456', role: 'admin' });
  const signedIn = await api().post('/api/auth/login').send({ email, password: 'ADMIN123456' });
  return { email, token: signedIn.body.token, id: signedIn.body.user.id };
}

// --- Catalogue and orders -------------------------------------------------------

// Listing through the API needs a real file upload, which one test covers on its own.
// Everywhere else the stock is set up straight through the model, so a suite about
// pickups is not also a suite about multipart forms.
export async function listProduct(seller, overrides = {}) {
  const sellerId = seller.seller_id ?? seller.profile_id ?? await profileIdFor('seller', seller.email);
  const storeId = seller.store_id ?? (await Store.findBySellerId(sellerId))?.id;
  const id = await Product.create({
    seller_id: sellerId,
    store_id: storeId,
    category_id: null,
    name: overrides.name || unique('Test Item '),
    description: 'Something to sell',
    price: overrides.price ?? 250,
    stock: overrides.stock ?? 10,
    image_url: '/uploads/test.png',
    audience: overrides.audience || 'women',
    sizes: overrides.sizes || ['M'],
    images: ['/uploads/test.png'],
  });
  return { id, price: overrides.price ?? 250, ...overrides };
}

export async function placeOrder(customer, items, overrides = {}) {
  const response = await api()
    .post('/api/orders')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({
      items: items.map((item) => ({ product_id: item.product_id ?? item.id, quantity: item.quantity ?? 1 })),
      address: overrides.address || 'Kabulonga, Lusaka',
      location: overrides.location || 'Lusaka',
      phone: overrides.phone || '+260 97 000 0001',
      paymentMethod: overrides.paymentMethod || 'cash',
    });
  return response;
}

// The parcels of an order, read straight from the database.
export async function shipmentsOf(orderId) {
  const [rows] = await pool.query('SELECT * FROM shipments WHERE order_id = ? ORDER BY id', [orderId]);
  return rows;
}

// A shop releases a parcel by marking it shipped; that is what puts it in the pool.
export function releaseParcel(seller, shipmentId) {
  return api()
    .patch(`/api/orders/shipments/${shipmentId}/status`)
    .set('Authorization', `Bearer ${seller.token}`)
    .send({ status: 'shipped' });
}

export const auth = (actor) => ({ Authorization: `Bearer ${actor.token}` });
