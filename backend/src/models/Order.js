// Orders, parcels and delivery — the heart of the system, and the largest file in it.
//
// The idea everything here turns on: an ORDER is what a shopper bought, and a PARCEL
// (a "shipment" in the database) is one shop's items within that order. A basket holding
// things from three shops becomes one order and three parcels, each collected from a
// different place, priced on its own distance, and delivered separately.
//
// The order's own status is a rollup of its parcels — whichever is furthest behind — so an
// order only reads "delivered" once every parcel has been.
//
// The rules live in this file rather than in the controllers, so they hold no matter which
// route, test or script reaches them.

import { pool } from '../config/db.js';
import { hasColumn, resolveCustomerId, resolveSellerId, resolveCourierId } from '../utils/accounts.js';
import { quoteDelivery } from '../services/courierProvider.js';

// 'shipped' means the shop has released the parcel — it is then open to every courier.
// 'picked_up' means one courier has claimed and collected it; only that courier can
// deliver it, and only their details are shown to the customer and the shop.
const TRACK_ORDER = ['placed', 'processing', 'shipped', 'pickup_requested', 'picked_up', 'delivered'];
const PAYMENT_METHOD_MAP = {
  'Airtel Money': 'airtel_money',
  airtel_money: 'airtel_money',
  'MTN MoMo': 'mtn_momo',
  mtn_momo: 'mtn_momo',
  Card: 'card',
  card: 'card',
};

// Round-robin-ish pick of an active courier account, so every order gets a real courier
// who is the only one (besides an admin) allowed to mark it delivered.
async function pickCourierAccount(connection) {
  // Counts parcels, not the legacy per-order courier row — otherwise every parcel in the
  // same order lands on one courier, since that row is only written once at the end.
  // Using the transaction's own connection means parcels already queued for this order
  // are counted too, so a multi-store order spreads across drivers.
  const [rows] = await connection.query(
    `SELECT c.id, c.name, c.phone
     FROM couriers c
     WHERE c.is_active = 1
     ORDER BY (SELECT COUNT(*) FROM shipments s WHERE s.courier_id = c.id AND s.status <> 'delivered') ASC, c.id ASC
     LIMIT 1`,
  );
  return rows[0] || null;
}

// Delivery pricing comes from the configured courier provider (services/courierProvider.js),
// measured between the shop's location and the delivery address rather than invented from
// an id. The quote is a pure function of those two places, so the fee shown at checkout is
// the fee charged when the order is placed.
async function estimateDelivery({ origin, destination }) {
  const quote = await quoteDelivery({ origin, destination });
  return {
    price: quote.price,
    distance: `${quote.distance_km} km`,
    direction: `${origin || 'Shop'} → ${destination || 'Customer'}`,
    provider: quote.provider,
    eta: quote.eta,
  };
}

class Order {
  // Prices a basket without creating anything: one parcel per store, each with its own
  // delivery fee, because each shop is a separate pickup. Used both by the checkout quote
  // and by order creation, so what the customer is shown is what they are charged.
  static async quoteForItems({ items, location, connection = pool }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw Object.assign(new Error('At least one item is required'), { status: 400 });
    }

    const lineItems = [];
    for (const item of items) {
      const quantity = Number(item.quantity) || 1;
      if (quantity < 1) throw Object.assign(new Error('Quantity must be at least 1'), { status: 400 });
      const [rows] = await connection.query(
        `SELECT p.id, p.name, p.price, p.stock, p.seller_id, s.name AS store_name,
                sel.account_status, sel.deleted_at
         FROM products p
         LEFT JOIN stores s ON s.id = p.store_id
         LEFT JOIN sellers sel ON sel.id = p.seller_id
         WHERE p.id = ?`,
        [item.product_id],
      );
      const product = rows[0];
      if (!product) throw Object.assign(new Error(`Product ${item.product_id} not found`), { status: 404 });
      // A shop that has been suspended or removed cannot be ordered from. Its products
      // leave the catalogue, but a basket filled before that still holds them, and the
      // product id is guessable — so the refusal belongs here, not only in the listing.
      if (product.deleted_at) {
        throw Object.assign(new Error(`${product.store_name || 'That shop'} is no longer on Zamglam, so ${product.name} cannot be ordered.`), { status: 409 });
      }
      if (product.account_status === 'suspended') {
        throw Object.assign(new Error(`${product.store_name || 'That shop'} is suspended, so ${product.name} cannot be ordered right now.`), { status: 409 });
      }
      if (Number(product.stock) < quantity) {
        throw Object.assign(new Error(`Not enough stock for ${product.name}`), { status: 409 });
      }
      lineItems.push({
        product_id: product.id,
        name: product.name,
        quantity,
        price: Number(product.price),
        seller_id: product.seller_id,
        store_name: product.store_name,
      });
    }

    const parcels = [];
    for (const sellerId of [...new Set(lineItems.map((line) => line.seller_id))]) {
      const parcelItems = lineItems.filter((line) => line.seller_id === sellerId);
      // Each parcel is priced from its own shop's location — a courier collecting from a
      // shop across town is a longer trip than one round the corner.
      const [storeRows] = await connection.query(
        'SELECT location, name FROM stores WHERE seller_id = ? LIMIT 1',
        [sellerId],
      );
      const origin = storeRows[0]?.location || storeRows[0]?.name || 'Lusaka';
      const courier = await estimateDelivery({ origin, destination: location });
      parcels.push({
        seller_id: sellerId,
        store_name: parcelItems[0].store_name,
        items: parcelItems,
        items_total: Number(parcelItems.reduce((sum, line) => sum + line.price * line.quantity, 0).toFixed(2)),
        delivery_fee: courier.price,
        distance: courier.distance,
        direction: courier.direction,
        provider: courier.provider,
        eta: courier.eta,
      });
    }

    const itemsTotal = Number(lineItems.reduce((sum, line) => sum + line.price * line.quantity, 0).toFixed(2));
    const deliveryTotal = Number(parcels.reduce((sum, parcel) => sum + parcel.delivery_fee, 0).toFixed(2));

    return {
      lineItems,
      parcels,
      items_total: itemsTotal,
      delivery_total: deliveryTotal,
      total: Number((itemsTotal + deliveryTotal).toFixed(2)),
    };
  }

  // Account-id resolution lives in utils/accounts.js — see the note there on the two
  // account schema shapes.
  static hasColumn(table, column) {
    return hasColumn(table, column);
  }

  // Shopper id from a signed-in user.
  static resolveCustomerId(user_id) {
    return resolveCustomerId(user_id);
  }

  // Shop id from a signed-in user.
  static resolveSellerId(user_id) {
    return resolveSellerId(user_id);
  }

  // Customer name/email live on the customers row directly, or on the linked users row.
  static async customerFieldsSql() {
    if (await Order.hasColumn('customers', 'user_id')) {
      return {
        select: 'c.name AS customer_name, u.email AS customer_email',
        join: 'JOIN customers c ON c.id = o.customer_id JOIN users u ON u.id = c.user_id',
      };
    }
    return {
      select: 'c.name AS customer_name, c.email AS customer_email',
      join: 'JOIN customers c ON c.id = o.customer_id',
    };
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

      // Same calculation the checkout quote used, so the customer is charged what they saw.
      const quote = await Order.quoteForItems({ items, location: location || address, connection });
      const { lineItems, parcels } = quote;
      const normalizedPaymentMethod = PAYMENT_METHOD_MAP[paymentMethod] || null;

      const [orderResult] = await connection.query(
        `INSERT INTO orders (customer_id, total_price, items_total, delivery_total, status, address, location, phone, payment_method)
         VALUES (?, ?, ?, ?, 'placed', ?, ?, ?, ?)`,
        [
          customerId,
          quote.total,
          quote.items_total,
          quote.delivery_total,
          address || '',
          location || '',
          phone || '',
          normalizedPaymentMethod,
        ],
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
        [orderId, paymentMethodColumn, quote.total, `zg-${orderId}-${Date.now()}`],
      );

      // One parcel per store: each store packs and hands over independently, and each parcel
      // gets its own courier, because the goods start in different physical shops.
      // No courier is assigned here. A parcel is offered to every courier once the shop
      // releases it, and whoever picks it up claims it — so courier_id stays null until
      // then, and with it the driver's details.
      for (const parcel of parcels) {
        await connection.query(
          `INSERT INTO shipments
             (order_id, seller_id, status, courier_id, price, distance, direction)
           VALUES (?, ?, 'placed', NULL, ?, ?, ?)`,
          [orderId, parcel.seller_id, parcel.delivery_fee, parcel.distance, parcel.direction],
        );
      }
      const firstParcel = parcels[0];

      // Keep the legacy per-order courier row in step with the first parcel so older
      // reads (and the order-level courier panel) still resolve.
      await connection.query(
        `INSERT INTO courier (order_id, courier_id, driver_name, driver_phone, price, distance, direction, status)
         VALUES (?, NULL, NULL, NULL, ?, ?, ?, 'awaiting_pickup')`,
        [orderId, firstParcel?.delivery_fee || 0, firstParcel?.distance || null, firstParcel?.direction || null],
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

  // Courier contact details are released only once the parcel has actually been picked up
  // (the shop marked it 'shipped'). Before that the customer/seller see that a courier is
  // assigned, but not how to contact them.
  // `viewer` is the role reading the order. A shop is asked to confirm that a named person
  // took its parcel, so it has to be told who is asking from the moment the request is
  // made — otherwise "confirm the handover" means confirming an anonymous claim. Everyone
  // else learns who the courier is only once the shop says the parcel changed hands.
  static withCourierContactVisibility(order, viewer = 'customer') {
    if (!order) return order;

    const gate = (courierish, status) => {
      if (!courierish) return courierish;
      const assigned = Boolean(courierish.courier_id);
      const pickedUp = ['picked_up', 'delivered'].includes(status) && assigned;
      // The shop it is being collected from, while the handover is pending.
      const awaitingThisShop = viewer === 'seller' && status === 'pickup_requested' && assigned;
      const reveal = pickedUp || awaitingThisShop;

      return {
        ...courierish,
        contact_available: pickedUp,
        driver_name: reveal ? courierish.driver_name : null,
        driver_phone: reveal ? courierish.driver_phone : null,
      };
    };

    return {
      ...order,
      courier: gate(order.courier, order.status),
      // Each parcel releases its own courier's details when that parcel is picked up.
      shipments: (order.shipments || []).map((shipment) => gate(shipment, shipment.status)),
    };
  }

  // The order's overall status is the least-advanced of its parcels: an order is only
  // 'delivered' when every store's parcel has been delivered.
  static async recomputeOrderStatus(orderId) {
    const [rows] = await pool.query('SELECT status FROM shipments WHERE order_id = ?', [orderId]);
    if (!rows.length) return null;
    const statuses = rows.map((r) => r.status);
    if (statuses.every((s) => s === 'cancelled')) return Order._setOrderStatus(orderId, 'cancelled');
    const ranked = statuses.filter((s) => s !== 'cancelled').map((s) => TRACK_ORDER.indexOf(s));
    const rollup = TRACK_ORDER[Math.min(...ranked)] || 'placed';
    return Order._setOrderStatus(orderId, rollup);
  }

  // Write the order’s rolled-up status.
  static async _setOrderStatus(orderId, status) {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    return status;
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
    const [shipments] = await pool.query(
      `SELECT sh.*, s.shop_name AS store_name FROM shipments sh
       LEFT JOIN sellers s ON s.id = sh.seller_id
       WHERE sh.order_id IN (?)`,
      [orderIds],
    );

    return orders.map((order) => {
      const orderItems = items.filter((item) => item.order_id === order.id);
      return {
        ...order,
        items: orderItems,
        courier: couriers.find((courier) => courier.order_id === order.id) || null,
        tracking: history.filter((event) => event.order_id === order.id),
        // Each parcel carries only its own store's items, status and courier.
        shipments: shipments
          .filter((shipment) => shipment.order_id === order.id)
          .map((shipment) => ({
            ...shipment,
            items: orderItems.filter((item) => item.seller_id === shipment.seller_id),
            tracking: history.filter((event) => event.order_id === order.id && event.shipment_id === shipment.id),
          })),
      };
    });
  }

  // One parcel, with the shop it is from.
  static async findShipmentById(shipmentId) {
    const [rows] = await pool.query(
      `SELECT sh.*, s.shop_name AS store_name FROM shipments sh
       LEFT JOIN sellers s ON s.id = sh.seller_id WHERE sh.id = ?`,
      [shipmentId],
    );
    return rows[0] || null;
  }

  // Move one parcel along, record a tracking event against it, mirror the legacy courier
  // row, then recompute the parent order's rollup status.
  static async updateShipmentStatus(shipmentId, status, note) {
    const shipment = await Order.findShipmentById(shipmentId);
    if (!shipment) return null;

    // Once a courier has the parcel it is out of the shop's hands: cancelling it then
    // would restore stock for goods that are on their way to the customer.
    if (status === 'cancelled' && ['picked_up', 'delivered'].includes(shipment.status)) {
      throw Object.assign(new Error('This parcel has already been collected and cannot be cancelled'), { status: 409 });
    }

    // Cancelling a parcel puts its items back on the shelf. Stock comes off when the order
    // is placed, so without this a cancelled parcel quietly destroys the shop's stock: the
    // goods are still there, but the catalogue says they are sold.
    if (status === 'cancelled' && shipment.status !== 'cancelled') {
      await pool.query(
        `UPDATE products p
         JOIN order_items oi ON oi.product_id = p.id
         SET p.stock = p.stock + oi.quantity
         WHERE oi.order_id = ? AND p.seller_id = ?`,
        [shipment.order_id, shipment.seller_id],
      );
      // A cancelled parcel is nobody's to collect, so it leaves the pool and any courier.
      await pool.query('UPDATE shipments SET courier_id = NULL, driver_name = NULL, driver_phone = NULL WHERE id = ?', [shipmentId]);
    }

    // Releasing the parcel starts the clock that the pool ages and escalation watches.
    if (status === 'shipped') {
      await pool.query('UPDATE shipments SET status = ?, released_at = CURRENT_TIMESTAMP WHERE id = ?', [status, shipmentId]);
    } else {
      await pool.query('UPDATE shipments SET status = ? WHERE id = ?', [status, shipmentId]);
    }
    await pool.query(
      'INSERT INTO order_status_history (order_id, shipment_id, status, note) VALUES (?, ?, ?, ?)',
      [shipment.order_id, shipmentId, status, note || null],
    );

    if (['shipped', 'picked_up', 'delivered'].includes(status)) {
      const courierStatus = status === 'delivered' ? 'delivered' : 'in_transit';
      await pool.query('UPDATE courier SET status = ? WHERE order_id = ?', [courierStatus, shipment.order_id]);
    }

    const orderStatus = await Order.recomputeOrderStatus(shipment.order_id);
    return { shipment_id: shipmentId, order_id: shipment.order_id, status, order_status: orderStatus };
  }

  // One order in full: its items, its parcels and its tracking.
  static async findDetailById(id) {
    const customerFields = await Order.customerFieldsSql();
    const [rows] = await pool.query(
      `SELECT o.*, ${customerFields.select}
       FROM orders o
       ${customerFields.join}
       WHERE o.id = ?`,
      [id],
    );
    if (!rows[0]) return null;
    const [detailed] = await Order._attachItems(rows);
    return detailed;
  }

  // A shopper’s own orders.
  static async findByCustomerUserId(user_id) {
    const customerId = await Order.resolveCustomerId(user_id);
    if (!customerId) return [];
    const [orders] = await pool.query('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [customerId]);
    return Order._attachItems(orders);
  }

  // Orders containing this shop’s products — trimmed to their own parcel and items, so
  // one shop never sees what another shop sold in the same basket.
  static async findBySellerUserId(user_id) {
    const sellerId = await Order.resolveSellerId(user_id);
    if (!sellerId) return [];
    const customerFields = await Order.customerFieldsSql();
    const [orders] = await pool.query(
      `SELECT DISTINCT o.*, ${customerFields.select}
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       ${customerFields.join}
       WHERE p.seller_id = ?
       ORDER BY o.created_at DESC`,
      [sellerId],
    );
    const withItems = await Order._attachItems(orders);
    // A seller works on their own parcel only: their items, their parcel status, their
    // courier. The order's rollup status is irrelevant to what they can do next.
    return withItems.map((order) => {
      const mine = order.shipments.find((shipment) => shipment.seller_id === sellerId);
      const myItems = order.items.filter((item) => item.seller_id === sellerId);
      // Credit this store only for its own lines (price x quantity). The order's
      // total_price covers every shop in the basket plus delivery, so using it here would
      // credit each seller for goods they never sold.
      const sellerTotal = Number(myItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2));
      return {
        ...order,
        items: myItems,
        shipments: mine ? [mine] : [],
        shipment_id: mine?.id || null,
        status: mine?.status || order.status,
        order_status: order.status,
        seller_total: sellerTotal,
        delivery_fee: Number(mine?.price || 0),
        courier: mine || order.courier,
      };
    });
  }

  static resolveCourierId(user_id) {
    return resolveCourierId(user_id);
  }

  // Couriers go on and off duty. Only on-duty couriers see the pool or receive escalated
  // parcels, so a parcel is never offered to nobody or pushed at someone who has finished.
  static async getCourierShift(user_id) {
    const courierId = await resolveCourierId(user_id);
    if (!courierId) return null;
    const [rows] = await pool.query('SELECT id, name, on_shift, shift_changed_at FROM couriers WHERE id = ?', [courierId]);
    return rows[0] || null;
  }

  // Parcels this courier is answerable for. A requested pickup counts: it has left the
  // pool, a shop is expecting that rider at the counter, and no other courier can take it.
  // Clocking off at that point would strand the parcel until the shop reported a no-show.
  static async countCarriedParcels(courierId) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS count FROM shipments WHERE courier_id = ? AND status IN ('pickup_requested', 'picked_up')",
      [courierId],
    );
    return Number(rows[0]?.count || 0);
  }

  static async setCourierShift(user_id, onShift) {
    const courierId = await resolveCourierId(user_id);
    if (!courierId) throw Object.assign(new Error('Courier profile not found'), { status: 404 });
    // A sign-up an admin has not approved yet cannot put itself on duty.
    if (onShift) {
      const [approval] = await pool.query('SELECT approval_status FROM couriers WHERE id = ?', [courierId]);
      if (approval[0] && approval[0].approval_status !== 'approved') {
        throw Object.assign(new Error('Your courier account is waiting for admin approval'), { status: 403 });
      }
    }


    // A courier holding somebody's parcel cannot clock off — the parcel would be stranded
    // with nobody able to deliver it, since only the courier who collected it can.
    if (!onShift) {
      const carrying = await Order.countCarriedParcels(courierId);
      if (carrying > 0) {
        throw Object.assign(
          new Error(`You still have ${carrying} parcel${carrying === 1 ? '' : 's'} to see through. Deliver ${carrying === 1 ? 'it' : 'them'}, or ask the shop to release ${carrying === 1 ? 'it' : 'them'} if you did not collect ${carrying === 1 ? 'it' : 'them'}, before going off duty.`),
          { status: 409 },
        );
      }
    }

    await pool.query(
      'UPDATE couriers SET on_shift = ?, shift_changed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [onShift ? 1 : 0, courierId],
    );
    return { on_shift: Boolean(onShift) };
  }

  // A courier's queue: every parcel assigned to them. The order's status tells the UI
  // whether it is still with the shop (placed/processing), ready to deliver (shipped),
  // or finished (delivered).
  // A courier's queue is a list of PARCELS (not orders): one row per store pickup, each
  // with its own status, address and items.
  static async findByCourierUserId(user_id) {
    const courierId = await Order.resolveCourierId(user_id);
    if (!courierId) return [];
    const customerFields = await Order.customerFieldsSql();
    const [orders] = await pool.query(
      `SELECT DISTINCT o.*, ${customerFields.select}
       FROM orders o
       JOIN shipments sh ON sh.order_id = o.id
       ${customerFields.join}
       WHERE sh.courier_id = ?
       ORDER BY o.created_at DESC`,
      [courierId],
    );
    const withItems = await Order._attachItems(orders);

    return withItems.flatMap((order) => order.shipments
      .filter((shipment) => shipment.courier_id === courierId)
      .map((shipment) => ({
        ...order,
        items: shipment.items,
        shipments: [shipment],
        shipment_id: shipment.id,
        status: shipment.status,
        order_status: order.status,
        store_name: shipment.store_name,
        // This parcel's own figures, not the whole basket's.
        parcel_total: Number(shipment.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2)),
        delivery_fee: Number(shipment.price || 0),
        courier: shipment,
      })));
  }

  // Is this courier carrying any parcel in this order?
  static async courierOwnsOrder(orderId, courier_user_id) {
    const courierId = await Order.resolveCourierId(courier_user_id);
    if (!courierId) return false;
    const [rows] = await pool.query(
      `SELECT 1 FROM shipments WHERE order_id = ? AND courier_id = ?
       UNION SELECT 1 FROM courier WHERE order_id = ? AND courier_id = ? LIMIT 1`,
      [orderId, courierId, orderId, courierId],
    );
    return rows.length > 0;
  }

  // Every parcel a shop has released and nobody has claimed yet — the open pool that all
  // couriers can see and pick from.
  static async findAvailableForPickup({ courier_user_id = null } = {}) {
    // Escalated parcels belong to the courier they were escalated to; everyone else sees
    // only the genuinely unclaimed ones.
    let mineId = null;
    if (courier_user_id) mineId = await Order.resolveCourierId(courier_user_id);

    const customerFields = await Order.customerFieldsSql();
    const [orders] = await pool.query(
      `SELECT DISTINCT o.*, ${customerFields.select}
       FROM orders o
       JOIN shipments sh ON sh.order_id = o.id
       ${customerFields.join}
       WHERE sh.status = 'shipped' AND (sh.courier_id IS NULL ${mineId ? 'OR sh.courier_id = ?' : ''})
       ORDER BY sh.released_at ASC`,
      mineId ? [mineId] : [],
    );
    const withItems = await Order._attachItems(orders);

    return withItems.flatMap((order) => order.shipments
      .filter((shipment) => shipment.status === 'shipped' && (shipment.courier_id === null || shipment.courier_id === mineId))
      .map((shipment) => ({
        ...order,
        items: shipment.items,
        shipments: [shipment],
        shipment_id: shipment.id,
        status: shipment.status,
        order_status: order.status,
        store_name: shipment.store_name,
        parcel_total: Number(shipment.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2)),
        delivery_fee: Number(shipment.price || 0),
        released_at: shipment.released_at,
        // Escalated to this courier rather than free for anyone to take.
        assigned_to_me: Boolean(mineId && shipment.courier_id === mineId),
        escalated_at: shipment.escalated_at,
        courier: shipment,
      })));
  }

  // Parcels a shop released that nobody has collected — the admin's stalled-work view.
  static async findUnclaimed() {
    const [rows] = await pool.query(
      `SELECT sh.id AS shipment_id, sh.order_id, sh.status, sh.released_at, sh.escalated_at,
              sh.courier_id, sh.price AS delivery_fee,
              s.shop_name AS store_name, c.name AS courier_name,
              o.address, o.location,
              TIMESTAMPDIFF(MINUTE, sh.released_at, CURRENT_TIMESTAMP) AS waiting_minutes
       FROM shipments sh
       JOIN sellers s ON s.id = sh.seller_id
       JOIN orders o ON o.id = sh.order_id
       LEFT JOIN couriers c ON c.id = sh.courier_id
       WHERE sh.status = 'shipped'
       ORDER BY sh.released_at ASC`,
    );
    return rows;
  }

  // A parcel nobody has taken within the threshold is assigned to the least-loaded courier
  // who is actually on duty, so it cannot sit in the pool forever. Assignment is not
  // collection: the courier still presses Pick up, which is what reveals their details.
  static async escalateStaleParcels(thresholdMinutes = 60) {
    const [stale] = await pool.query(
      `SELECT id, order_id FROM shipments
       WHERE status = 'shipped' AND courier_id IS NULL AND released_at IS NOT NULL
         AND released_at < (CURRENT_TIMESTAMP - INTERVAL ? MINUTE)
       ORDER BY released_at ASC`,
      [thresholdMinutes],
    );
    if (!stale.length) return [];

    const escalated = [];
    for (const parcel of stale) {
      const [couriers] = await pool.query(
        `SELECT c.id, c.name, c.phone FROM couriers c
         WHERE c.is_active = 1 AND c.on_shift = 1
         ORDER BY (SELECT COUNT(*) FROM shipments s WHERE s.courier_id = c.id AND s.status <> 'delivered') ASC, c.id ASC
         LIMIT 1`,
      );
      const courier = couriers[0];
      // Nobody is on duty: leave it in the pool rather than assigning it to someone who
      // cannot act. It stays visible to the admin as stalled.
      if (!courier) break;

      const [result] = await pool.query(
        `UPDATE shipments SET courier_id = ?, escalated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND courier_id IS NULL AND status = 'shipped'`,
        [courier.id, parcel.id],
      );
      if (result.affectedRows === 0) continue;

      await pool.query(
        'INSERT INTO order_status_history (order_id, shipment_id, status, note) VALUES (?, ?, ?, ?)',
        [parcel.order_id, parcel.id, 'shipped', `Unclaimed for ${thresholdMinutes} minutes — assigned to ${courier.name}.`],
      );
      escalated.push({ shipment_id: parcel.id, courier_id: courier.id, courier_name: courier.name });
    }
    return escalated;
  }

  // Handing a parcel over takes both sides. The courier asks for it; the shop confirms
  // they physically gave it to that person. Only then is it picked up, and only then are
  // the courier's details released — so a courier cannot obtain a customer's contact
  // details, or claim a delivery, by tapping a button from anywhere.
  static async requestPickup(shipmentId, courier_user_id) {
    const courierId = await Order.resolveCourierId(courier_user_id);
    if (!courierId) throw Object.assign(new Error('Courier profile not found'), { status: 404 });

    const [courierRows] = await pool.query('SELECT id, name, phone, on_shift FROM couriers WHERE id = ?', [courierId]);
    const courier = courierRows[0];
    if (!courier.on_shift) {
      throw Object.assign(new Error('Go on duty before requesting parcels'), { status: 409 });
    }

    // First to ask wins, so two couriers cannot both be waiting on the same parcel.
    const [result] = await pool.query(
      `UPDATE shipments
       SET courier_id = ?, driver_name = ?, driver_phone = ?, status = 'pickup_requested'
       WHERE id = ? AND status = 'shipped' AND (courier_id IS NULL OR courier_id = ?)`,
      [courierId, courier.name, courier.phone || null, shipmentId, courierId],
    );

    if (result.affectedRows === 0) {
      const existing = await Order.findShipmentById(shipmentId);
      if (!existing) throw Object.assign(new Error('Parcel not found'), { status: 404 });
      if (existing.status === 'pickup_requested') throw Object.assign(new Error('Another courier is already collecting this parcel'), { status: 409 });
      if (existing.courier_id) throw Object.assign(new Error('Another courier has already taken this parcel'), { status: 409 });
      throw Object.assign(new Error('This parcel has not been released by the shop yet'), { status: 409 });
    }

    const shipment = await Order.findShipmentById(shipmentId);
    await Order._recordEvent(shipment.order_id, shipmentId, 'pickup_requested', `${courier.name} is collecting this parcel; waiting for the shop to confirm.`);
    await Order.recomputeOrderStatus(shipment.order_id);
    return { shipment_id: Number(shipmentId), courier_id: courierId, status: 'pickup_requested' };
  }

  // The shop confirms the courier in front of them actually took the parcel.
  static async confirmPickup(shipmentId, seller_user_id) {
    const sellerId = await resolveSellerId(seller_user_id);
    const shipment = await Order.findShipmentById(shipmentId);
    if (!shipment) throw Object.assign(new Error('Parcel not found'), { status: 404 });
    if (Number(shipment.seller_id) !== Number(sellerId)) {
      throw Object.assign(new Error('That parcel is not from your shop'), { status: 403 });
    }
    if (shipment.status !== 'pickup_requested') {
      throw Object.assign(new Error('No courier is waiting to collect this parcel'), { status: 409 });
    }

    await pool.query("UPDATE shipments SET status = 'picked_up' WHERE id = ?", [shipmentId]);
    await Order._recordEvent(shipment.order_id, shipmentId, 'picked_up', `Shop confirmed handover to ${shipment.driver_name || 'the courier'}.`);
    await pool.query(
      "UPDATE courier SET courier_id = ?, driver_name = ?, driver_phone = ?, status = 'in_transit' WHERE order_id = ?",
      [shipment.courier_id, shipment.driver_name, shipment.driver_phone, shipment.order_id],
    );
    await Order.recomputeOrderStatus(shipment.order_id);
    return { shipment_id: Number(shipmentId), status: 'picked_up' };
  }

  // The shop says the courier never turned up. The parcel goes back to the pool for
  // somebody else, and the customer is told why it is taking longer.
  static async denyPickup(shipmentId, seller_user_id, reason) {
    const sellerId = await resolveSellerId(seller_user_id);
    const shipment = await Order.findShipmentById(shipmentId);
    if (!shipment) throw Object.assign(new Error('Parcel not found'), { status: 404 });
    if (Number(shipment.seller_id) !== Number(sellerId)) {
      throw Object.assign(new Error('That parcel is not from your shop'), { status: 403 });
    }
    if (shipment.status !== 'pickup_requested') {
      throw Object.assign(new Error('No collection is pending on this parcel'), { status: 409 });
    }

    const refused = shipment.driver_name || 'The courier';
    await pool.query(
      `UPDATE shipments
       SET status = 'shipped', courier_id = NULL, driver_name = NULL, driver_phone = NULL,
           released_at = CURRENT_TIMESTAMP, escalated_at = NULL
       WHERE id = ?`,
      [shipmentId],
    );
    await Order._recordEvent(
      shipment.order_id,
      shipmentId,
      'shipped',
      `${refused} did not collect the parcel${reason ? ` (${reason})` : ''}. It is back with the shop and open to other couriers.`,
    );
    await pool.query("UPDATE courier SET courier_id = NULL, driver_name = NULL, driver_phone = NULL, status = 'awaiting_pickup' WHERE order_id = ?", [shipment.order_id]);
    await Order.recomputeOrderStatus(shipment.order_id);
    return { shipment_id: Number(shipmentId), status: 'shipped', returned_to_pool: true };
  }

  // Write one line of tracking, and keep the order’s own status in step with its parcels.
  // This is where the customer-facing history comes from.
  static async _recordEvent(orderId, shipmentId, status, note) {
    await pool.query(
      'INSERT INTO order_status_history (order_id, shipment_id, status, note) VALUES (?, ?, ?, ?)',
      [orderId, shipmentId, status, note || null],
    );
  }


  // Is this courier the one carrying this parcel? Guards marking it delivered.
  static async courierOwnsShipment(shipmentId, courier_user_id) {
    const courierId = await Order.resolveCourierId(courier_user_id);
    if (!courierId) return false;
    const [rows] = await pool.query('SELECT 1 FROM shipments WHERE id = ? AND courier_id = ? LIMIT 1', [shipmentId, courierId]);
    return rows.length > 0;
  }

  // Is this parcel from this shop? Guards confirming and denying a handover.
  static async sellerOwnsShipment(shipmentId, seller_user_id) {
    const sellerId = await Order.resolveSellerId(seller_user_id);
    if (!sellerId) return false;
    const [rows] = await pool.query('SELECT 1 FROM shipments WHERE id = ? AND seller_id = ? LIMIT 1', [shipmentId, sellerId]);
    return rows.length > 0;
  }

  // Does this shop have anything in this order?
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

  // Is this order this shopper’s own? Guards reading somebody else’s order.
  static async customerOwnsOrder(orderId, customer_user_id) {
    const customerId = await Order.resolveCustomerId(customer_user_id);
    if (!customerId) return false;
    const [rows] = await pool.query('SELECT 1 FROM orders WHERE id = ? AND customer_id = ? LIMIT 1', [orderId, customerId]);
    return rows.length > 0;
  }

  // Move a whole order at once. Parcels normally move one at a time; this is for the
  // cases that act on the order as a whole, such as an administrator cancelling it.
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
