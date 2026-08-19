import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SuspendedNotice from '../components/SuspendedNotice';
import { useAuth } from '../context/AuthContext';
import { getAvailableParcels, getMyOrders, getShift, requestPickup, updateShipmentStatus } from '../api/orderApi';
import CourierShiftToggle from '../components/CourierShiftToggle';
import { formatWaiting, isOverdue } from '../utils/waiting';
import { formatZmwPrice } from '../utils/currency';

const sections = ['Available', 'Deliveries', 'Completed', 'Stores'];

// Once a courier has collected a parcel it is theirs to deliver.
// A requested parcel is not yours until the shop confirms; it still belongs in your list
// so you can see you are waiting on them.
const isOutForDelivery = (order) => order.status === 'picked_up' || order.status === 'pickup_requested';

export default function CourierDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('Available');
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [available, setAvailable] = useState([]);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [onShift, setOnShift] = useState(false);

  const load = () => {
    getMyOrders()
      .then((rows) => {
        // A parcel the rider was holding only leaves their list one way: the shop said it
        // was never collected and put it back in the pool. Say so, rather than letting it
        // disappear without explanation.
        setOrders((previous) => {
          const held = previous.filter((order) => isOutForDelivery(order));
          const stillMine = new Set(rows.map((order) => order.shipmentId));
          const returned = held.filter((order) => !stillMine.has(order.shipmentId));
          if (returned.length) {
            const names = returned.map((order) => `#${order.id}`).join(', ');
            setMessage(`${returned.length === 1 ? 'Parcel' : 'Parcels'} ${names} went back to the shop — they reported it was not collected. It is open to other couriers again.`);
          }
          return rows;
        });
      })
      .catch(() => setMessage('Could not load your parcels.'));
    getAvailableParcels().then(setAvailable).catch(() => {});
    getShift().then((s) => setOnShift(Boolean(s.on_shift))).catch(() => {});
  };

  useEffect(() => {
    load();
    const poll = window.setInterval(load, 5000);
    return () => window.clearInterval(poll);
  }, []);

  const matchesQuery = (order) => `${order.id} ${order.address} ${order.customerName || ''}`
    .toLowerCase()
    .includes(query.toLowerCase());

  const availableParcels = useMemo(() => available.filter(matchesQuery), [available, query]);
  const myDeliveries = useMemo(() => orders.filter((o) => isOutForDelivery(o) && matchesQuery(o)), [orders, query]);
  const deliveredParcels = useMemo(() => orders.filter((o) => o.status === 'delivered' && matchesQuery(o)), [orders, query]);

  // Which shops this courier collects from most, counted from their own parcels — a
  // courier only ever sees their own work, so this stays within what they may know.
  const storeVisits = useMemo(() => {
    const counts = new Map();
    orders.forEach((order) => {
      const store = order.storeName || 'Unknown store';
      const entry = counts.get(store) || { store, pickups: 0, delivered: 0 };
      entry.pickups += 1;
      if (order.status === 'delivered') entry.delivered += 1;
      counts.set(store, entry);
    });
    return [...counts.values()].sort((a, b) => b.pickups - a.pickups);
  }, [orders]);
  const busiestCount = storeVisits[0]?.pickups || 1;

  if (user && user.role !== 'courier') return <Navigate to="/" replace />;

  const pickUp = async (order) => {
    setBusyId(order.shipmentId);
    setMessage('');
    try {
      await requestPickup(order.shipmentId);
      setMessage(`Collection requested from ${order.storeName || 'the shop'}. They need to confirm the handover before it is yours to deliver.`);
      load();
      setActive('Deliveries');
    } catch (error) {
      // Another courier may have taken it a moment earlier.
      setMessage(error.response?.data?.error || 'Could not pick up that parcel.');
      load();
    } finally {
      setBusyId(null);
    }
  };

  const markDelivered = async (order) => {
    setBusyId(order.shipmentId);
    setMessage('');
    try {
      await updateShipmentStatus(order.shipmentId, 'delivered');
      setMessage(`Parcel from ${order.storeName || 'the shop'} (order #${order.id}) marked delivered.`);
      load();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not update that parcel.');
    } finally {
      setBusyId(null);
    }
  };

  const ParcelCard = ({ order, action }) => (
    <article className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">Pick up from {order.storeName || 'shop'}</p>
        <p className="text-xs text-slate-400">Order #{order.id} · parcel #{order.shipmentId}</p>
        {order.status === 'shipped' && order.releasedAt && (
          <p className={`mt-1 text-xs font-semibold ${isOverdue(order.releasedAt) ? 'text-rose-600' : 'text-slate-500'}`}>
            Waiting {formatWaiting(order.releasedAt)}
            {order.assignedToMe && ' · assigned to you'}
            {isOverdue(order.releasedAt) && !order.assignedToMe && ' · overdue'}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-600">Deliver to {order.customerName || 'Customer'} · {order.phone || 'No phone'}</p>
        <p className="text-sm text-slate-500">{order.address}{order.location ? `, ${order.location}` : ''}</p>
        <p className="mt-1 text-xs text-slate-400">
          {(order.items || []).map((item) => `${item.name} x${item.quantity}`).join(', ')}
        </p>
        {order.courier && (
          <p className="mt-1 text-xs text-slate-400">
            {order.courier.distance} · fee {formatZmwPrice(order.courier.price)} · {order.courier.direction}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        {/* Only parcels this courier holds can be opened — an unclaimed pool parcel is
            not theirs to inspect yet. */}
        {order.status !== 'shipped' && (
          <Link to={`/orders/${order.id}`} className="text-xs font-semibold text-emerald-800 hover:underline">View order →</Link>
        )}
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{order.status}</span>
        {/* This parcel's goods and its own fee — not the whole basket's total. */}
        <span className="text-sm font-bold text-slate-700">{formatZmwPrice(order.parcelTotal ?? 0)}</span>
        <span className="text-xs font-semibold text-emerald-800">fee {formatZmwPrice(order.deliveryFee ?? 0)}</span>
        {action}
      </div>
    </article>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={sections} active={active} onSelect={setActive} role="courier" />
      <div className="min-w-0 flex-1">
        <Topbar onSearch={setQuery} /><SuspendedNotice />
        <main className="mx-auto max-w-6xl space-y-6 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">Courier</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Hello, {user?.name?.split(' ')[0] || 'driver'}</h1>
            <p className="mt-1 text-slate-500">Parcels assigned to you. Only you can confirm one has been delivered.</p>
          </div>

          {/* Duty status decides whether this courier is offered work at all. */}
          <CourierShiftToggle onChange={(next) => { setOnShift(next); load(); }} />

          {message && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>}

          {/* Each figure opens the section it summarises. */}
          <div className="grid gap-4 sm:grid-cols-3">
            <button type="button" onClick={() => setActive('Available')} className="text-left">
              <DashboardCard title="Available to pick up" value={availableParcels.length} detail="Released by shops, unclaimed" />
            </button>
            <button type="button" onClick={() => setActive('Deliveries')} className="text-left">
              <DashboardCard title="Out for delivery" value={myDeliveries.length} detail="You collected these" />
            </button>
            <button type="button" onClick={() => setActive('Completed')} className="text-left">
              <DashboardCard title="Delivered" value={deliveredParcels.length} detail="Completed by you" />
            </button>
          </div>

          {active === 'Available' && (
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Parcels waiting for a courier</h2>
                <p className="mt-1 text-slate-500">Any courier can take these. Once you pick one up it is yours to deliver, and the customer sees your details.</p>
              </div>
              {availableParcels.length ? availableParcels.map((order) => (
                <ParcelCard
                  key={order.shipmentId}
                  order={order}
                  action={(
                    <button
                      type="button"
                      disabled={busyId === order.shipmentId}
                      onClick={() => pickUp(order)}
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      {busyId === order.shipmentId ? 'Requesting…' : 'Request pickup'}
                    </button>
                  )}
                />
              )) : (
                <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
                  {onShift
                    ? 'No parcels are waiting for pickup right now.'
                    : 'You are off duty — go on duty to see parcels waiting for pickup.'}
                </p>
              )}
            </section>
          )}

          {active === 'Deliveries' && (
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Out for delivery</h2>
                <p className="mt-1 text-slate-500">Parcels you picked up. Only you can mark these delivered.</p>
              </div>
              {myDeliveries.length ? myDeliveries.map((order) => (
                <ParcelCard
                  key={order.shipmentId}
                  order={order}
                  action={order.status === 'pickup_requested' ? (
                    // Not yours to deliver until the shop confirms you actually took it.
                    <span className="max-w-[10rem] text-right text-xs font-semibold text-amber-700">
                      Waiting for {order.storeName || 'the shop'} to confirm handover
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === order.shipmentId}
                      onClick={() => markDelivered(order)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {busyId === order.shipmentId ? 'Saving…' : 'Mark delivered'}
                    </button>
                  )}
                />
              )) : <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">You have not picked up any parcels yet.</p>}
            </section>
          )}

          {active === 'Stores' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Stores you collect from most</h2>
                <p className="mt-1 text-slate-500">Based on the parcels assigned to you. Browse any shop to check their prices.</p>
              </div>
              {storeVisits.length ? (
                <div className="space-y-3">
                  {storeVisits.map((entry) => (
                    <article key={entry.store} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{entry.store}</p>
                        <p className="text-sm text-slate-500">
                          {entry.pickups} pickup{entry.pickups === 1 ? '' : 's'} · {entry.delivered} delivered
                        </p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-700" style={{ width: `${(entry.pickups / busiestCount) * 100}%` }} />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
                  No pickups yet — once you deliver, your busiest shops appear here.
                </p>
              )}
              <Link to="/products" className="inline-block rounded-lg border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:border-emerald-700 hover:text-emerald-700">
                Explore the catalogue and prices →
              </Link>
            </section>
          )}

          {active === 'Completed' && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">Delivered parcels</h2>
              {deliveredParcels.length ? deliveredParcels.map((order) => (
                <ParcelCard key={order.shipmentId} order={order} action={<span className="text-xs font-semibold text-emerald-600">Delivered</span>} />
              )) : <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">No deliveries completed yet.</p>}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
