// Courier work and actions in the dashboard header.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableParcels, getMyOrders, requestPickup } from '../api/orderApi';
import { isLocalDemoSession } from '../utils/localSession';

export default function DeliveryIcon() {
  const [available, setAvailable] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const panel = useRef(null);
  const previousAvailable = useRef(null);
  const previousDeliveries = useRef(null);

  const load = useCallback(() => {
    if (isLocalDemoSession()) return Promise.resolve();
    return Promise.all([getAvailableParcels(), getMyOrders()])
      .then(([availableRows, assignedRows]) => {
        const nextAvailable = Array.isArray(availableRows) ? availableRows : [];
        const nextOrders = Array.isArray(assignedRows) ? assignedRows : [];
        const nextDeliveries = new Set(nextOrders.filter((order) => order.status === 'picked_up').map((order) => order.shipmentId));

        if (previousAvailable.current && nextAvailable.some((order) => !previousAvailable.current.has(order.shipmentId))) setOpen(true);
        if (previousDeliveries.current && [...nextDeliveries].some((id) => !previousDeliveries.current.has(id))) setOpen(true);

        previousAvailable.current = new Set(nextAvailable.map((order) => order.shipmentId));
        previousDeliveries.current = nextDeliveries;
        setAvailable(nextAvailable);
        setMyOrders(nextOrders);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const poll = window.setInterval(load, 5000);
    return () => window.clearInterval(poll);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => { if (panel.current && !panel.current.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const awaitingShop = myOrders.filter((order) => order.status === 'pickup_requested');
  const readyToDeliver = myOrders.filter((order) => order.status === 'picked_up');
  const count = available.length + awaitingShop.length + readyToDeliver.length;
  const title = count
    ? `${count} courier update${count === 1 ? '' : 's'}: pickups, handovers, or deliveries`
    : 'No courier updates';

  const claim = async (parcel) => {
    setBusyId(parcel.shipmentId);
    setMessage('');
    try {
      await requestPickup(parcel.shipmentId);
      setMessage(`Pickup requested from ${parcel.storeName || 'the shop'}. Waiting for handover confirmation.`);
      await load();
    } catch (error) {
      setMessage(error?.response?.data?.error || error?.error || 'Could not request that pickup. Refresh and try again.');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative" ref={panel}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={title}
        aria-expanded={open}
        title={`${title} · refreshes every 5 seconds`}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-white/10"
      >
        📦
        {count > 0 && <span className="absolute right-0 top-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{count}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 max-h-[75vh] w-80 max-w-[90vw] space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-left shadow-xl">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Courier updates</p>
            <span className="text-[11px] text-slate-400">Live · 5 sec</span>
          </div>

          {message && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{message}</p>}

          {available.map((parcel) => (
            <article key={parcel.shipmentId} className="rounded-md border border-sky-200 bg-sky-50 p-3">
              <p className="text-sm font-semibold text-sky-950">Pickup available · order #{parcel.id}</p>
              <p className="mt-1 text-xs text-sky-800">{parcel.storeName || 'A shop'}{parcel.assignedToMe ? ' · assigned to you' : ''}</p>
              <button type="button" disabled={busyId === parcel.shipmentId} onClick={() => claim(parcel)} className="mt-2 rounded-md bg-sky-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-900 disabled:opacity-50">
                {busyId === parcel.shipmentId ? 'Requesting…' : 'Request pickup'}
              </button>
            </article>
          ))}

          {awaitingShop.map((order) => (
            <Link key={order.shipmentId} to="/courier/dashboard?section=Deliveries" onClick={() => setOpen(false)} className="block rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-950">Handover requested · order #{order.id}</p>
              <p className="mt-1 text-xs text-amber-800">Waiting for {order.storeName || 'the shop'} to confirm pickup.</p>
              <span className="mt-2 inline-block text-xs font-semibold text-amber-900">View delivery status</span>
            </Link>
          ))}

          {readyToDeliver.map((order) => (
            <article key={order.shipmentId} className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-emerald-950">Ready to deliver · order #{order.id}</p>
              <p className="mt-1 text-xs text-emerald-800">{order.storeName || 'Shop'} confirmed the handover.</p>
              <Link to="/courier/dashboard?section=Deliveries" onClick={() => setOpen(false)} className="mt-2 inline-block text-xs font-semibold text-emerald-900 underline underline-offset-2">Open delivery details</Link>
            </article>
          ))}

          {count === 0 && <p className="px-1 py-3 text-sm text-slate-500">No pickups or delivery actions waiting.</p>}
          <Link to={`/courier/dashboard?section=${available.length ? 'Available' : 'Deliveries'}`} onClick={() => setOpen(false)} className="block border-t border-slate-100 px-1 pt-3 text-xs font-semibold text-emerald-800">
            Open courier dashboard
          </Link>
        </div>
      )}
    </div>
  );
}