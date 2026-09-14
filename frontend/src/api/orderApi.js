import apiClient from './axios';
import { STATUS_META, TRACK_STEPS } from '../utils/orderStore';

// Adapts a raw backend order row into the shape TrackingTimeline.jsx / CourierInfo.jsx /
// the order pages already expect (camelCase fields, tracking events with label/note/at,
// a courier object with eta/progress). Keeps those display components unchanged.
function adaptOrder(raw) {
  if (!raw) return raw;

  const status = TRACK_STEPS.includes(raw.status) ? raw.status : 'placed';
  const currentIndex = TRACK_STEPS.indexOf(status);

  const tracking = (raw.tracking || []).map((event) => ({
    status: event.status,
    label: STATUS_META[event.status]?.label || event.status,
    note: event.note || STATUS_META[event.status]?.note || '',
    at: event.created_at ? new Date(event.created_at).toLocaleString('en-ZM', { dateStyle: 'medium', timeStyle: 'short' }) : '',
  }));

  const courierRow = raw.courier;
  const courier = courierRow ? {
    driver_name: courierRow.driver_name,
    driver_phone: courierRow.driver_phone,
    // Contact details are released by the backend only once the parcel is picked up.
    contact_available: Boolean(courierRow.contact_available),
    provider: 'Zamglam Courier',
    price: Number(courierRow.price || 0),
    distance: courierRow.distance,
    direction: courierRow.direction,
    status: courierRow.status,
    eta: courierRow.status === 'delivered' ? 'Delivered' : courierRow.status === 'in_transit' ? '25-40 min' : 'Pending pickup',
    progress: courierRow.status === 'delivered' ? 100 : courierRow.status === 'in_transit' ? 40 : 0,
  } : null;

  return {
    id: raw.id,
    // A multi-store order ships as one parcel per store; sellers and couriers act on a
    // single parcel, so their rows carry shipment_id and that parcel's status.
    shipmentId: raw.shipment_id || null,
    orderStatus: raw.order_status || raw.status,
    storeName: raw.store_name,
    shipments: (raw.shipments || []).map((shipment) => ({
      id: shipment.id,
      sellerId: shipment.seller_id,
      storeName: shipment.store_name,
      status: shipment.status,
      driverName: shipment.driver_name,
      driverPhone: shipment.driver_phone,
      contactAvailable: Boolean(shipment.contact_available),
      releasedAt: shipment.released_at || null,
      price: Number(shipment.price || 0),
      distance: shipment.distance,
      direction: shipment.direction,
      items: (shipment.items || []).map((item) => ({
        id: item.product_id,
        name: item.name,
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        image_url: item.image_url,
        store_name: item.store_name,
      })),
      tracking: (shipment.tracking || []).map((event) => ({
        status: event.status,
        label: STATUS_META[event.status]?.label || event.status,
        note: event.note || STATUS_META[event.status]?.note || '',
        at: event.created_at ? new Date(event.created_at).toLocaleString('en-ZM', { dateStyle: 'medium', timeStyle: 'short' }) : '',
      })),
    })),
    status,
    createdAt: raw.created_at,
    total: Number(raw.total_price || 0),
    itemsTotal: Number(raw.items_total || 0),
    deliveryTotal: Number(raw.delivery_total || 0),
    // What THIS store earns / THIS parcel is worth, as opposed to the whole basket.
    releasedAt: raw.released_at || null,
    assignedToMe: Boolean(raw.assigned_to_me),
    escalatedAt: raw.escalated_at || null,
    sellerTotal: raw.seller_total != null ? Number(raw.seller_total) : null,
    parcelTotal: raw.parcel_total != null ? Number(raw.parcel_total) : null,
    deliveryFee: raw.delivery_fee != null ? Number(raw.delivery_fee) : null,
    address: raw.address || '',
    location: raw.location || '',
    phone: raw.phone || '',
    paymentMethod: raw.payment_method,
    customerName: raw.customer_name,
    customerEmail: raw.customer_email,
    items: (raw.items || []).map((item) => ({
      id: item.product_id,
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      image_url: item.image_url,
      store_name: item.store_name,
      sellerName: item.store_name,
    })),
    tracking,
    courier,
    trackIndex: currentIndex,
  };
}

export async function createOrder({ items, address, location, phone, paymentMethod }) {
  const payload = {
    items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    address,
    location,
    phone,
    paymentMethod,
  };
  const { data } = await apiClient.post('/orders', payload);
  // The create endpoint only returns {id, status}; fetch the full record (with the
  // auto-assigned courier/tracking row) so the confirmation screen has everything to show.
  return getOrder(data.id);
}

// Price the basket before placing it, so checkout can show delivery per shop.
export async function quoteOrder({ items, location }) {
  const { data } = await apiClient.post('/orders/quote', {
    items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    location,
  });
  return data;
}

export async function getMyOrders() {
  const { data } = await apiClient.get('/orders');
  return Array.isArray(data) ? data.map(adaptOrder) : [];
}

export async function getOrder(id) {
  const { data } = await apiClient.get(`/orders/${id}`);
  return adaptOrder(data);
}

export async function updateOrderStatus(id, status) {
  const { data } = await apiClient.patch(`/orders/${id}/status`, { status });
  return data;
}

// Parcels released by shops that no courier has claimed — every courier sees these.
export async function getAvailableParcels() {
  const { data } = await apiClient.get('/orders/shipments/available');
  return Array.isArray(data) ? data.map(adaptOrder) : [];
}

// Admin: parcels released by shops that nobody has collected, with waiting time.
export async function getUnclaimedParcels() {
  const { data } = await apiClient.get('/orders/shipments/unclaimed');
  return Array.isArray(data) ? data : [];
}

// A courier's duty state. Only on-duty couriers see the pool or get escalated parcels.
export async function getShift() {
  const { data } = await apiClient.get('/orders/courier/shift');
  return data;
}

export async function setShift(onShift) {
  const { data } = await apiClient.patch('/orders/courier/shift', { on_shift: onShift });
  return data;
}

// Handing a parcel over takes both sides: the courier asks, the shop confirms.

// A courier asks for a parcel. Their details stay hidden until the shop confirms.
export async function requestPickup(shipmentId) {
  const { data } = await apiClient.patch(`/orders/shipments/${shipmentId}/pickup-request`);
  return data;
}

// The shop confirms the courier in front of them took it — this reveals their details.
export async function confirmPickup(shipmentId) {
  const { data } = await apiClient.patch(`/orders/shipments/${shipmentId}/pickup-confirm`);
  return data;
}

// The shop says the courier never collected it; it goes back to the pool.
export async function denyPickup(shipmentId, reason) {
  const { data } = await apiClient.patch(`/orders/shipments/${shipmentId}/pickup-deny`, { reason });
  return data;
}

// The customer's own confirmation that the parcel arrived.
export async function confirmDelivery(shipmentId) {
  const { data } = await apiClient.patch(`/orders/shipments/${shipmentId}/confirm-delivery`);
  return data;
}

// Move a single store's parcel within an order, leaving the other stores' parcels alone.
export async function updateShipmentStatus(shipmentId, status) {
  const { data } = await apiClient.patch(`/orders/shipments/${shipmentId}/status`, { status });
  return data;
}
