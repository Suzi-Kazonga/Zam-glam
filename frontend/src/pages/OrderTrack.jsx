import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CourierInfo from '../components/CourierInfo';
import TrackingTimeline from '../components/TrackingTimeline';
import { useAuth } from '../context/AuthContext';
import { confirmDelivery, getOrder, updateOrderStatus } from '../api/orderApi';
import { isLocalDemoSession, LOCAL_DEMO_ORDER_MESSAGE } from '../utils/localSession';
import SellerRatingForm from '../components/SellerRatingForm';
import ReportPartyForm from '../components/ReportPartyForm';
import { getMyRatings } from '../api/reviewApi';

export default function OrderTrack() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [myRatings, setMyRatings] = useState([]);

  const loadRatings = () => {
    if (user?.role !== 'customer' || isLocalDemoSession()) return;
    getMyRatings().then(setMyRatings).catch(() => setMyRatings([]));
  };

  const refresh = () => {
    getOrder(id).then(setOrder).catch(() => setLoadError('That order could not be found.'));
  };

  useEffect(() => {
    if (isLocalDemoSession()) {
      setLoadError(LOCAL_DEMO_ORDER_MESSAGE);
      return undefined;
    }
    refresh();
    loadRatings();
    // Poll for updates (e.g. a seller advancing the status) without a manual refresh.
    const poll = window.setInterval(refresh, 5000);
    return () => window.clearInterval(poll);
  }, [id]);

  if (loadError) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Tracking not found</h1>
        <p className="mt-3 text-slate-500">{loadError}</p>
        <Link to="/products" className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">Back to shop</Link>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-slate-500">Loading order…</p>
      </section>
    );
  }


  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Link to={user?.role === 'customer' ? '/customer/dashboard' : '/products'} className="text-sm font-semibold text-indigo-600">← Back</Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-indigo-600">Live tracking</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Order #{order.id}</h1>
      <p className="mt-2 text-slate-500">{order.items?.[0]?.name} · Deliver to {order.address || 'your address'}</p>

      {order.shipments?.length > 1 ? (
        <div className="mt-8 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-bold text-slate-900">
                {order.shipments.filter((s) => s.status === 'delivered').length} of {order.shipments.length} packages delivered
              </p>
              <p className="text-sm text-slate-500">From {order.shipments.length} different shops</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${(order.shipments.filter((s) => s.status === 'delivered').length / order.shipments.length) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Each shop packs and hands over its own package, so they arrive separately — at different times, and possibly with different couriers.
            </p>
          </div>
          {order.shipments.map((shipment, index) => (
            <div key={shipment.id} className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-slate-900">Package {index + 1}/{order.shipments.length} · {shipment.storeName}</h2>
                  <p className="text-sm text-slate-500">{shipment.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{shipment.status}</span>
              </div>
              <TrackingTimeline order={{ status: shipment.status, tracking: shipment.tracking }} />
              {/* The courier saying it arrived is their word for it; this is the
                  customer's. Rating only opens once the customer has confirmed. */}
              {shipment.status === 'delivered' && user?.role === 'customer' && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Did this package reach you?</p>
                  <p className="mt-1 text-xs text-emerald-800">{shipment.driverName || 'The courier'} marked it delivered. Confirm so the order can be completed.</p>
                  <button
                    type="button"
                    onClick={() => confirmDelivery(shipment.id).then(refresh).catch((e) => setLoadError(e?.error || 'Could not confirm that.'))}
                    className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Confirm I received this
                  </button>
                </div>
              )}

              {shipment.status === 'confirmed' && user?.role === 'customer' && (
                <div className="mt-4">
                  <SellerRatingForm
                    order={order}
                    sellerId={shipment.sellerId}
                    sellerName={shipment.storeName}
                    existing={myRatings.find((r) => r.order_id === order.id && r.seller_id === shipment.sellerId)}
                    onSaved={loadRatings}
                  />
                </div>
              )}
              <div className="mt-4">
                <CourierInfo delivery={{
                  driver_name: shipment.driverName,
                  driver_phone: shipment.driverPhone,
                  contact_available: shipment.contactAvailable,
                  released_at: shipment.releasedAt,
                  price: shipment.price,
                  distance: shipment.distance,
                  direction: shipment.direction,
                  progress: shipment.status === 'delivered' ? 100 : shipment.status === 'shipped' ? 40 : 0,
                  eta: shipment.status === 'delivered' ? 'Delivered' : shipment.status === 'shipped' ? '25-40 min' : 'Pending pickup',
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <TrackingTimeline order={order} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {order.shipments?.length > 1 ? null : <CourierInfo delivery={order.courier} />}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-lg text-slate-900">Shipment details</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Payment:</span> {order.paymentMethod || '—'}</p>
            <p><span className="font-semibold">Phone:</span> {order.phone || '—'}</p>
            <p><span className="font-semibold">Items:</span> K{Number(order.itemsTotal || order.total || 0).toFixed(2)}</p>
            {order.deliveryTotal > 0 && (
              <p>
                <span className="font-semibold">Delivery:</span> K{Number(order.deliveryTotal).toFixed(2)}
                {order.shipments?.length > 1 && ` · ${order.shipments.length} parcels`}
              </p>
            )}
            <p><span className="font-semibold">Total paid:</span> K{Number(order.total || 0).toFixed(2)}</p>
            <p className="capitalize"><span className="font-semibold">Status:</span> {order.status}</p>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4"><ReportPartyForm orderId={order.id} /></div>

          {order.status !== 'delivered' && (
            <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {order.courier?.driver_name
                ? `${order.courier.driver_name} collected your parcel and will confirm the delivery.`
                : 'Once a courier collects your parcel, their name and number appear here.'}
            </p>
          )}
          {order.status === 'delivered' && (
            <Link to="/customer/dashboard" className="mt-5 inline-block text-sm font-semibold text-indigo-600">Rate this seller →</Link>
          )}
        </div>
      </div>
    </main>
  );
}
