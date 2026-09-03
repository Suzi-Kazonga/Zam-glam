import { pool } from '../config/db.js';

const DRIVERS = ['Mwansa Phiri', 'Joseph Banda', 'Thandiwe Zulu', 'Natasha Mulenga'];
const PAYMENT_METHOD_MAP = {
  'Airtel Money': 'airtel_money',
  airtel_money: 'airtel_money',
  'MTN MoMo': 'mtn_momo',
  mtn_momo: 'mtn_momo',
  Card: 'card',
  card: 'card',
};

function estimateDelivery(seed, destination) {
  // No real geocoding from a free-text address yet, so estimate a plausible distance the
  // same way the previous frontend mock did, keyed off the order id for a stable value.
  const distanceKm = 2 + (Math.abs(Number(seed) || 0) % 9);
  const price = Number((20 + distanceKm * 5).toFixed(2));
  const driver = DRIVERS[Math.abs(Number(seed) || 0) % DRIVERS.length];
  return {
    driver_name: driver,
    price,
    distance: `${distanceKm.toFixed(1)} km`,
    direction: destination ? `Zamglam store → ${destination}` : 'Zamglam store',
  };
}

class Order {
  static async resolveCustomerId(user_id) {
    const [rows] = await pool.query('SELECT id FROM customers WHERE user_id = ?', [user_id]);
    return rows[0]?.id || null;
  }

  static async resolveSellerId(user_id) {
    const [rows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [user_id]);
    return rows[0]?.id || null;
  }

  // Create an order for the given items, in a transaction. Prices are always read from
  // the products table server-side, never trusted from the client.
  static async createForCustomer({ user_id, items, address, location, phone, paymentMethod }) {
    const customerId = await Order.resolveCustomerId(user_id);
    if (!customerId) {
      const error = new Error('Customer profile not found');
      error.status = 404;
      throw error;
    }
    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('At least one item is required');
      error.status = 400;
      throw error;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const lineItems = [];
      for (const item of items) {
        const quantity = Number(item.quantity) || 1;
        if (quantity < 1) throw Object.assign(new Error('Quantity must be at least 1'), { status: 400 });
        const [rows] = await connection.query('SELECT id, price, stock FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
        const product = rows[0];
        if (!product) throw Object.assign(new Error(`Product ${item.product_id} not found`), { status: 404 });
        if (Number(product.stock) < quantity) throw Object.assign(new Error(`Not enough stock for product ${item.product_id}`), { status: 409 });
        lineItems.push({ product_id: product.id, quantity, price: Number(product.price) });
      }

      const total = lineItems.reduce((sum, line) => sum + line.price * line.quantity, 0);
      const normalizedPaymentMethod = PAYMENT_METHOD_MAP[paymentMethod] || null;

      const [orderResult] = await connection.query(
        `INSERT INTO orders (customer_id, total_price, status, address, location, phone, payment_method)
         VALUES (?, ?, 'placed', ?, ?, ?, ?)`,
        [customerId, total, address || '', location || '', phone || '', normalizedPaymentMethod],
      );
      const orderId = orderResult.insertId;

      for (const line of lineItems) {
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, line.product_id, line.quantity, line.price],
        );
        await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [line.quantity, line.product_id]);
      }

      await connection.query(
        "INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'placed', ?)",
        [orderId, `Paid with ${paymentMethod || 'Card'}.`],
      );

      const paymentMethodColumn = normalizedPaymentMethod === 'card' ? 'card' : 'mobile_money';
      await connection.query(
        `INSERT INTO payments (order_id, method, amount, status, transaction_ref)
         VALUES (?, ?, ?, 'successful', ?)`,
        [orderId, paymentMethodColumn, total, `zg-${orderId}-${Date.now()}`],
      );

      const courier = estimateDelivery(orderId, location || address);
      await connection.query(
        `INSERT INTO courier (order_id, driver_name, price, distance, direction, status)
         VALUES (?, ?, ?, ?, ?, 'assigned')`,
        [orderId, courier.driver_name, courier.price, courier.distance, courier.direction],
      );

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async _attachItems(orders) {
    if (!orders.length) return orders;
    const orderIds = orders.map((order) => order.id);
    const [items] = await pool.query(
      `SELECT oi.order_id, oi.product_id, oi.quantity, oi.price, p.name, p.image_url, p.seller_id, s.name AS store_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN stores s ON s.id = p.store_id
       WHERE oi.order_id IN (?)`,
      [orderIds],
    );
    const [couriers] = await pool.query('SELECT * FROM courier WHERE order_id IN (?)', [orderIds]);
    const [history] = await pool.query('SELECT * FROM order_status_history WHERE order_id IN (?) ORDER BY created_at ASC', [orderIds]);

    return orders.map((order) => ({
      ...order,
      items: items.filter((item) => item.order_id === order.id),
      courier: couriers.find((courier) => courier.order_id === order.id) || null,
      tracking: history.filter((event) => event.order_id === order.id),
    }));
  }

  static async findDetailById(id) {
    const [rows] = await pool.query(
      `SELECT o.*, c.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       JOIN users u ON u.id = c.user_id
       WHERE o.id = ?`,
      [id],
    );
    if (!rows[0]) return null;
    const [detailed] = await Order._attachItems(rows);
    return detailed;
  }

  static async findByCustomerUserId(user_id) {
    const customerId = await Order.resolveCustomerId(user_id);
    if (!customerId) return [];
    const [orders] = await pool.query('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [customerId]);
    return Order._attachItems(orders);
  }

  static async findBySellerUserId(user_id) {
    const sellerId = await Order.resolveSellerId(user_id);
    if (!sellerId) return [];
    const [orders] = await pool.query(
      `SELECT DISTINCT o.*, c.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       JOIN customers c ON c.id = o.customer_id
       JOIN users u ON u.id = c.user_id
       WHERE p.seller_id = ?
       ORDER BY o.created_at DESC`,
      [sellerId],
    );
    const withItems = await Order._attachItems(orders);
    // Only show this seller's own line items within each (possibly multi-seller) order.
    return withItems.map((order) => ({
      ...order,
      items: order.items.filter((item) => item.seller_id === sellerId),
    }));
  }

  static async sellerOwnsOrder(orderId, seller_user_id) {
    const sellerId = await Order.resolveSellerId(seller_user_id);
    if (!sellerId) return false;
    const [rows] = await pool.query(
      `SELECT 1 FROM order_items oi JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ? AND p.seller_id = ? LIMIT 1`,
      [orderId, sellerId],
    );
    return rows.length > 0;
  }

  static async customerOwnsOrder(orderId, customer_user_id) {
    const customerId = await Order.resolveCustomerId(customer_user_id);
    if (!customerId) return false;
    const [rows] = await pool.query('SELECT 1 FROM orders WHERE id = ? AND customer_id = ? LIMIT 1', [orderId, customerId]);
    return rows.length > 0;
  }

  static async updateStatus(id, status, note) {
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) return false;
    await pool.query('INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)', [id, status, note || null]);
    if (status === 'shipped') {
      await pool.query("UPDATE courier SET status = 'in_transit' WHERE order_id = ?", [id]);
    } else if (status === 'delivered') {
      await pool.query("UPDATE courier SET status = 'delivered' WHERE order_id = ?", [id]);
    }
    return true;
  }
}

export default Order;
