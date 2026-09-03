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
    status,
    createdAt: raw.created_at,
    total: Number(raw.total_price || 0),
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
