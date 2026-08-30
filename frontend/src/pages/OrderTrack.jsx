import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CourierInfo from '../components/CourierInfo';
import TrackingTimeline from '../components/TrackingTimeline';
import { useAuth } from '../context/AuthContext';
import { advanceCourierProgress, getOrderById, updateOrderStatus } from '../utils/orderStore';

export default function OrderTrack() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(() => getOrderById(id));

  const refresh = () => setOrder(getOrderById(id));

  useEffect(() => {
    refresh();
  }, [id]);

  useEffect(() => {
    if (!order || order.status === 'delivered') return undefined;

    if (order.status === 'placed') {
      const timer = window.setTimeout(() => {
        updateOrderStatus(id, 'processing');
        refresh();
      }, 5000);
      return () => window.clearTimeout(timer);
    }

    if (order.status === 'shipped' && Number(order.courier?.progress || 0) < 100) {
      const timer = window.setInterval(() => {
        advanceCourierProgress(id);
        refresh();
      }, 900);
      return () => window.clearInterval(timer);
    }

    return undefined;
  }, [id, order?.status, order?.courier?.progress]);

  if (!order) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Tracking not found</h1>
        <p className="mt-3 text-slate-500">That order is not in this browser.</p>
        <Link to="/products" className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">Back to shop</Link>
      </section>
    );
  }

  const markReceived = () => {
    updateOrderStatus(id, 'delivered');
    refresh();
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Link to={user?.role === 'customer' ? '/customer/dashboard' : '/products'} className="text-sm font-semibold text-indigo-600">← Back</Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-indigo-600">Live tracking</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Order #{order.id}</h1>
      <p className="mt-2 text-slate-500">{order.items?.[0]?.name} · Deliver to {order.address || 'your address'}</p>

      <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
        <TrackingTimeline order={order} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CourierInfo delivery={order.courier} />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-lg text-slate-900">Shipment details</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Payment:</span> {order.paymentMethod || '—'}</p>
            <p><span className="font-semibold">Phone:</span> {order.phone || '—'}</p>
            <p><span className="font-semibold">Total:</span> K{Number(order.total || 0).toFixed(2)}</p>
            <p className="capitalize"><span className="font-semibold">Status:</span> {order.status}</p>
          </div>
          {order.status !== 'delivered' && (
            <button type="button" onClick={markReceived} className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Mark as received
            </button>
          )}
          {order.status === 'delivered' && (
            <Link to="/customer/dashboard" className="mt-5 inline-block text-sm font-semibold text-indigo-600">Rate this seller →</Link>
          )}
        </div>
      </div>
    </main>
  );
}
