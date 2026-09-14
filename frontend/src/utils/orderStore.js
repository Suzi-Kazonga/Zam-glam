// Pure lookup constants for order status display. Order data itself now lives in the
// real backend (see frontend/src/api/orderApi.js) — this file used to also hold a
// localStorage-backed mock order store, which has been removed now that orders persist
// server-side. TrackingTimeline.jsx and CourierInfo.jsx import these directly.

export const TRACK_STEPS = ['placed', 'processing', 'shipped', 'pickup_requested', 'picked_up', 'delivered', 'confirmed'];

export const STATUS_META = {
  placed: { label: 'Order placed', note: 'We received your order and payment.' },
  processing: { label: 'Shop is packing', note: 'The seller is preparing your items.' },
  shipped: { label: 'Ready for pickup', note: 'The shop has released it; a courier will collect it.' },
  pickup_requested: { label: 'Courier collecting', note: 'A courier is collecting it; the shop must confirm the handover.' },
  picked_up: { label: 'Out for delivery', note: 'The shop confirmed the courier collected the parcel.' },
  delivered: { label: 'Delivered', note: 'The courier marked it delivered.' },
  confirmed: { label: 'Receipt confirmed', note: 'You confirmed the package arrived.' },
};
