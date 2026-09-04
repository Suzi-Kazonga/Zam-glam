import { pool } from '../config/db.js';
import { hasColumn, resolveCustomerId, resolveSellerId, resolveCourierId } from '../utils/accounts.js';

const DRIVERS =['Mwansa Phiri', 'Joseph Banda', 'Thandiwe Zulu', 'Natasha Mulenga'];
// 'shipped' means the shop has released the parcel — it is then open to every courier.
// 'picked_up' means one courier has claimed and collected it; only that courier can
// deliver it, and only their details are shown to the customer and the shop.
const TRACK_ORDER = ['placed', 'processing', 'shipped', 'picked_up', 'delivered'];
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

// Keyed on the seller, never the order, so the fee quoted at checkout is exactly the fee
// charged when the order is placed — an order id does not exist yet at quote time.
// (No geocoding from a free-text address yet; this is a stand-in for a real distance.)
function estimateDelivery(seed, destination) {
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
        `SELECT p.id, p.name, p.price, p.stock, p.seller_id, s.name AS store_name
         FROM products p LEFT JOIN stores s ON s.id = p.store_id WHERE p.id = ?`,
        [item.product_id],
      );
      const product = rows[0];
      if (!product) throw Object.assign(new Error(`Product ${item.product_id} not found`), { status: 404 });
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
      const courier = estimateDelivery(sellerId, location);
      parcels.push({
        seller_id: sellerId,
        store_name: parcelItems[0].store_name,
        items: parcelItems,
        items_total: Number(parcelItems.reduce((sum, line) => sum + line.price * line.quantity, 0).toFixed(2)),
        delivery_fee: courier.price,
        distance: courier.distance,
        direction: courier.direction,
        driver_name: courier.driver_name,
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

  static resolveCustomerId(user_id) {
    return resolveCustomerId(user_id);
  }

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
  static withCourierContactVisibility(order) {
    if (!order) return order;
    // A courier's details are released only once they have actually picked the parcel up.
    // Before that nobody is assigned, so there is nothing to show; a parcel merely
    // released by the shop is still sitting in the open pool.
    const gate = (courierish, status) => {
      if (!courierish) return courierish;
      const pickedUp = (status === 'picked_up' || status === 'delivered') && Boolean(courierish.courier_id);
      return {
        ...courierish,
        contact_available: pickedUp,
        driver_name: pickedUp ? courierish.driver_name : null,
        driver_phone: pickedUp ? courierish.driver_phone : null,
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

    if (status === 'shipped' || status === 'delivered') {
      const courierStatus = status === 'delivered' ? 'delivered' : 'in_transit';
      await pool.query('UPDATE courier SET status = ? WHERE order_id = ?', [courierStatus, shipment.order_id]);
    }

    const orderStatus = await Order.recomputeOrderStatus(shipment.order_id);
    return { shipment_id: shipmentId, order_id: shipment.order_id, status, order_status: orderStatus };
  }

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

  static async findByCustomerUserId(user_id) {
    const customerId = await Order.resolveCustomerId(user_id);
    if (!customerId) return [];
    const [orders] = await pool.query('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [customerId]);
    return Order._attachItems(orders);
  }

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

  // Parcels a courier is currently carrying: collected but not yet delivered.
  static async countCarriedParcels(courierId) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS count FROM shipments WHERE courier_id = ? AND status = 'picked_up'",
      [courierId],
    );
    return Number(rows[0]?.count || 0);
  }

  static async setCourierShift(user_id, onShift) {
    const courierId = await resolveCourierId(user_id);
    if (!courierId) throw Object.assign(new Error('Courier profile not found'), { status: 404 });

    // A courier holding somebody's parcel cannot clock off — the parcel would be stranded
    // with nobody able to deliver it, since only the courier who collected it can.
    if (!onShift) {
      const carrying = await Order.countCarriedParcels(courierId);
      if (carrying > 0) {
        throw Object.assign(
          new Error(`You are carrying ${carrying} parcel${carrying === 1 ? '' : 's'}. Deliver ${carrying === 1 ? 'it' : 'them'} before going off duty.`),
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

  // Claim a parcel. The WHERE clause carries courier_id IS NULL so that if two couriers
  // tap "Pick up" at the same moment, exactly one of them wins.
  static async claimShipment(shipmentId, courier_user_id) {
    const courierId = await Order.resolveCourierId(courier_user_id);
    if (!courierId) throw Object.assign(new Error('Courier profile not found'), { status: 404 });

    const [courierRows] = await pool.query('SELECT id, name, phone, on_shift FROM couriers WHERE id = ?', [courierId]);
    const courier = courierRows[0];

    if (!courier.on_shift) {
      throw Object.assign(new Error('Go on duty before picking up parcels'), { status: 409 });
    }

    // Unclaimed parcels are first come, first served; a parcel escalated to this courier is
    // already theirs, so they may collect that one too.
    const [result] = await pool.query(
      `UPDATE shipments
       SET courier_id = ?, driver_name = ?, driver_phone = ?, status = 'picked_up'
       WHERE id = ? AND status = 'shipped' AND (courier_id IS NULL OR courier_id = ?)`,
      [courierId, courier.name, courier.phone || null, shipmentId, courierId],
    );

    if (result.affectedRows === 0) {
      const existing = await Order.findShipmentById(shipmentId);
      if (!existing) throw Object.assign(new Error('Parcel not found'), { status: 404 });
      if (existing.courier_id) throw Object.assign(new Error('Another courier has already taken this parcel'), { status: 409 });
      throw Object.assign(new Error('This parcel has not been released by the shop yet'), { status: 409 });
    }

    const shipment = await Order.findShipmentById(shipmentId);
    await pool.query(
      'INSERT INTO order_status_history (order_id, shipment_id, status, note) VALUES (?, ?, ?, ?)',
      [shipment.order_id, shipmentId, 'picked_up', `Collected by ${courier.name}.`],
    );
    await pool.query(
      "UPDATE courier SET courier_id = ?, driver_name = ?, driver_phone = ?, status = 'in_transit' WHERE order_id = ?",
      [courierId, courier.name, courier.phone || null, shipment.order_id],
    );
    await Order.recomputeOrderStatus(shipment.order_id);

    return { shipment_id: Number(shipmentId), courier_id: courierId, status: 'picked_up' };
  }

  static async courierOwnsShipment(shipmentId, courier_user_id) {
    const courierId = await Order.resolveCourierId(courier_user_id);
    if (!courierId) return false;
    const [rows] = await pool.query('SELECT 1 FROM shipments WHERE id = ? AND courier_id = ? LIMIT 1', [shipmentId, courierId]);
    return rows.length > 0;
  }

  static async sellerOwnsShipment(shipmentId, seller_user_id) {
    const sellerId = await Order.resolveSellerId(seller_user_id);
    if (!sellerId) return false;
    const [rows] = await pool.query('SELECT 1 FROM shipments WHERE id = ? AND seller_id = ? LIMIT 1', [shipmentId, sellerId]);
    return rows.length > 0;
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
