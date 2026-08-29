const STORAGE_KEY = 'zamglam_customer_orders';

export const TRACK_STEPS = ['placed', 'processing', 'shipped', 'delivered'];

export const STATUS_META = {
  placed: { label: 'Order placed', note: 'We received your order and payment.' },
  processing: { label: 'Shop is packing', note: 'The seller is preparing your items.' },
  shipped: { label: 'Out for delivery', note: 'Zamglam Courier is on the way.' },
  delivered: { label: 'Delivered', note: 'The package was received.' },
};

const drivers = ['Mwansa Phiri', 'Joseph Banda', 'Thandiwe Zulu', 'Natasha Mulenga'];

function stamp() {
  return new Date().toLocaleString('en-ZM', { dateStyle: 'medium', timeStyle: 'short' });
}

function trackingEvent(status, extraNote) {
  return {
    status,
    label: STATUS_META[status]?.label || status,
    note: extraNote || STATUS_META[status]?.note || '',
    at: stamp(),
  };
}

function defaultCourier(order) {
  const destination = order.address || 'Lusaka';
  const store = order.items?.[0]?.store_name || order.items?.[0]?.sellerName || 'Zamglam store';
  return {
    driver_name: drivers[Math.abs(String(order.id).length) % drivers.length],
    provider: 'Zamglam Courier',
    price: 35,
    distance: '4.2 km',
    direction: `${store} → ${destination}`,
    eta: '25-40 min',
    progress: order.status === 'delivered' ? 100 : order.status === 'shipped' ? 12 : 0,
  };
}

function historyForStatus(status, createdAt) {
  const index = Math.max(0, TRACK_STEPS.indexOf(status));
  return TRACK_STEPS.slice(0, index + 1).map((step, stepIndex) => ({
    ...trackingEvent(step),
    at: stepIndex === 0 ? createdAt || stamp() : stamp(),
  }));
}

export function normalizeOrder(order) {
  if (!order) return order;
  const status = TRACK_STEPS.includes(order.status) ? order.status : 'placed';
  return {
    ...order,
    status,
    tracking: Array.isArray(order.tracking) && order.tracking.length ? order.tracking : historyForStatus(status, order.createdAt),
    courier: order.courier || defaultCourier({ ...order, status }),
  };
}

const seedOrders = [
  {
    id: 'ord-demo-1',
    customerEmail: 'demo',
    status: 'delivered',
    createdAt: '2026-08-20',
    total: 380,
    address: 'Kabulonga, Lusaka',
    phone: '+260 97 701 1101',
    paymentMethod: 'Airtel Money',
    items: [
      {
        id: 431,
        name: 'Mud Denim Shirt',
        price: 380,
        quantity: 1,
        image_url: '/images/products/mud-shirt.jpg',
        store_name: 'Mud',
        sellerName: 'Mud',
      },
    ],
    tracking: [
      { status: 'placed', label: 'Order placed', note: 'Paid with Airtel Money.', at: '20 Aug 2026, 10:12' },
      { status: 'processing', label: 'Shop is packing', note: 'Mud prepared the shirt.', at: '20 Aug 2026, 10:40' },
      { status: 'shipped', label: 'Out for delivery', note: 'Zamglam Courier picked up the parcel.', at: '20 Aug 2026, 12:05' },
      { status: 'delivered', label: 'Delivered', note: 'Left with the customer in Kabulonga.', at: '20 Aug 2026, 12:48' },
    ],
    courier: {
      driver_name: 'Mwansa Phiri',
      provider: 'Zamglam Courier',
      price: 35,
      distance: '4.2 km',
      direction: 'Mud → Kabulonga, Lusaka',
      eta: 'Delivered',
      progress: 100,
    },
  },
];

function readOrders() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedOrders));
      return seedOrders.map((order) => normalizeOrder({ ...order, items: [...order.items] }));
    }
    const parsed = JSON.parse(stored);
    return (Array.isArray(parsed) ? parsed : seedOrders).map((order) => normalizeOrder(order));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return seedOrders.map((order) => normalizeOrder({ ...order, items: [...order.items] }));
  }
}

function writeOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return orders;
}

export function getOrders() {
  return readOrders();
}

export function getOrderById(id) {
  return readOrders().find((order) => String(order.id) === String(id)) || null;
}

export function getCustomerOrders(customerEmail) {
  return readOrders().filter((order) => order.customerEmail === customerEmail || order.customerEmail === 'demo');
}

export function getSellerOrders(sellerName) {
  const name = String(sellerName || '').toLowerCase();
  return readOrders().filter((order) => order.items.some((item) => String(item.sellerName || item.store_name || '').toLowerCase() === name));
}

export function createOrder({ items, customerEmail, customerName, total, address, phone, paymentMethod }) {
  const order = normalizeOrder({
    id: `ord-${Date.now()}`,
    customerEmail: customerEmail || 'guest',
    customerName: customerName || 'Guest shopper',
    status: 'placed',
    createdAt: new Date().toISOString().slice(0, 10),
    total: Number(total || 0),
    address: address || '',
    phone: phone || '',
    paymentMethod: paymentMethod || 'Card',
    items: items.map((item) => ({
      id: item.id,
      name: item.name || item.title,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      image_url: item.image_url,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      store_name: item.store_name || item.sellerName,
      sellerName: item.sellerName || item.store_name,
    })),
    tracking: [trackingEvent('placed', `Paid with ${paymentMethod || 'Card'}.`)],
  });
  return { order, orders: writeOrders([order, ...readOrders()]) };
}

export function updateOrderStatus(id, status) {
  const orders = readOrders().map((order) => {
    if (String(order.id) !== String(id) || order.status === status) return order;
    const tracking = [...(order.tracking || [])];
    if (!tracking.some((event) => event.status === status)) tracking.push(trackingEvent(status));
    const courier = { ...(order.courier || defaultCourier(order)) };
    if (status === 'shipped') {
      courier.progress = Math.max(courier.progress || 0, 10);
      courier.eta = '25-40 min';
    }
    if (status === 'delivered') {
      courier.progress = 100;
      courier.eta = 'Delivered';
    }
    return { ...order, status, tracking, courier };
  });
  return writeOrders(orders);
}

export function updateOrderCourier(id, courierUpdates) {
  const orders = readOrders().map((order) => (
    String(order.id) === String(id) ? { ...order, courier: { ...order.courier, ...courierUpdates } } : order
  ));
  return writeOrders(orders);
}

export function advanceCourierProgress(id) {
  const order = getOrderById(id);
  if (!order || order.status !== 'shipped') return order;
  const nextProgress = Math.min(100, Number(order.courier?.progress || 0) + 12);
  const remaining = Math.max(5, Math.round((100 - nextProgress) / 4));
  updateOrderCourier(id, {
    progress: nextProgress,
    eta: nextProgress >= 100 ? 'Arriving now' : `${remaining}-${remaining + 12} min`,
  });
  return getOrderById(id);
}

export function ensureDemoSellerOrder() {
  const orders = readOrders();
  if (orders.some((order) => order.id === 'ord-demo-open')) return orders;

  const openOrder = normalizeOrder({
    id: 'ord-demo-open',
    customerEmail: 'customer@zamglam.local',
    customerName: 'Chanda Banda',
    status: 'processing',
    createdAt: new Date().toISOString().slice(0, 10),
    total: 480,
    address: 'Kabulonga, Lusaka',
    phone: '+260 97 701 1101',
    paymentMethod: 'MTN MoMo',
    items: [
      {
        id: 434,
        name: 'Mud Canvas Shoes',
        price: 480,
        quantity: 1,
        image_url: '/images/products/mud-shoes.jpg',
        store_name: 'Mud',
        sellerName: 'Mud',
      },
    ],
    tracking: [
      { status: 'placed', label: 'Order placed', note: 'Paid with MTN MoMo.', at: stamp() },
      { status: 'processing', label: 'Shop is packing', note: 'Waiting for Mud to dispatch.', at: stamp() },
    ],
  });
  return writeOrders([openOrder, ...orders]);
}

export function sellersFromOrder(order) {
  const names = new Set();
  return (order.items || []).filter((item) => {
    const name = item.sellerName || item.store_name;
    if (!name || names.has(name)) return false;
    names.add(name);
    return true;
  }).map((item) => ({
    sellerName: item.sellerName || item.store_name,
    productName: item.name,
  }));
}
