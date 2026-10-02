// The shop’s notification bell in the header.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { confirmPickup, denyPickup, getMyOrders } from '../api/orderApi';
import { getMessageThreads } from '../api/messageApi';
import { isLocalDemoSession } from '../utils/localSession';

// The shop's notifications. Two things land here: parcels still waiting to be packed or
// released, and — the urgent one — couriers standing at the counter asking the shop to
// confirm a handover. A pickup request opens this panel by itself the first time it is
// seen, because somebody is waiting on it.
const NEEDS_PACKING = ['placed', 'processing'];

export default function SellerOrderIcon() {
  const [orders, setOrders] = useState([]);
  const [customerThreads, setCustomerThreads] = useState([]);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const announced = useRef(new Set());
  const seenPackingOrders = useRef(null);
  const seenCustomerThreads = useRef(null);
  const panel = useRef(null);

  const load = useCallback(() => {
    if (isLocalDemoSession()) return Promise.resolve();
    getMessageThreads().then((threads) => {
      const waiting = threads.filter((thread) => thread.last_sender_role === 'customer');
      const ids = new Set(waiting.map((thread) => `${thread.store_id}:${thread.customer_id}`));
      if (seenCustomerThreads.current && [...ids].some((id) => !seenCustomerThreads.current.has(id))) setOpen(true);
      seenCustomerThreads.current = ids;
      setCustomerThreads(waiting);
    }).catch(() => {});
    return getMyOrders()
      .then((rows) => {
        setOrders(rows);

        const packingIds = new Set(rows
          .filter((order) => NEEDS_PACKING.includes(order.status))
          .map((order) => order.shipmentId || order.id));
        if (seenPackingOrders.current && [...packingIds].some((id) => !seenPackingOrders.current.has(id))) setOpen(true);
        seenPackingOrders.current = packingIds;

        // Open on a request this browser has not shown yet, and never again for that one,
        // so the panel does not fight the shop every ten seconds.
        const requests = rows.filter((order) => order.status === 'pickup_requested');
        const fresh = requests.filter((order) => !announced.current.has(order.shipmentId));
        if (fresh.length) {
          fresh.forEach((order) => announced.current.add(order.shipmentId));
          setOpen(true);
        }
        // A request that has been dealt with can announce itself again if it comes back.
        const live = new Set(requests.map((order) => order.shipmentId));
        announced.current.forEach((id) => { if (!live.has(id)) announced.current.delete(id); });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const poll = window.setInterval(load, 5000);
    return () => window.clearInterval(poll);
  }, [load]);

  // Clicking anywhere else closes the panel.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => { if (panel.current && !panel.current.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const pickupRequests = orders.filter((order) => order.status === 'pickup_requested');
  const toPack = orders.filter((order) => NEEDS_PACKING.includes(order.status));
  const count = pickupRequests.length + toPack.length + customerThreads.length;

  const answer = async (order, accept) => {
    setBusyId(order.shipmentId);
    setMessage('');
    try {
      if (accept) {
        await confirmPickup(order.shipmentId);
        setMessage(`Order #${order.id} handed over.`);
      } else {
        await denyPickup(order.shipmentId, 'The courier did not collect the parcel');
        setMessage(`Order #${order.id} is back in the pool for another courier.`);
      }
      await load();
    } catch (error) {
      setMessage(error?.error || 'That did not work. Try again.');
    } finally {
      setBusyId(null);
    }
  };

  const attention = [
    pickupRequests.length && `${pickupRequests.length} courier handover${pickupRequests.length === 1 ? '' : 's'} waiting`,
    customerThreads.length && `${customerThreads.length} customer message${customerThreads.length === 1 ? '' : 's'} waiting`,
    toPack.length && `${toPack.length} order${toPack.length === 1 ? '' : 's'} to pack or release`,
  ].filter(Boolean);
  const title = attention.length ? attention.join(', ') : 'Nothing waiting on you';

  return (
    <div className="relative" ref={panel}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={title}
        aria-expanded={open}
        title={title}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-white/10"
      >
        🧾
        {count > 0 && (
          <span className={`absolute right-0 top-0 rounded-full px-2 py-0.5 text-xs font-bold text-white ${pickupRequests.length ? 'bg-amber-500' : 'bg-red-600'}`}>
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[90vw] rounded-lg border border-slate-200 bg-white p-3 text-left shadow-xl">
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Notifications</p>

          {message && <p className="mb-2 rounded bg-slate-100 px-3 py-2 text-xs text-slate-700">{message}</p>}

          {pickupRequests.map((order) => (
            <div key={order.shipmentId} className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">
                {order.courier?.driver_name || 'A courier'} is collecting order #{order.id}
              </p>
              <p className="mt-1 text-xs text-amber-800">Confirm only once the parcel is in their hands.</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === order.shipmentId}
                  onClick={() => answer(order, true)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Picked up
                </button>
                <button
                  type="button"
                  disabled={busyId === order.shipmentId}
                  onClick={() => answer(order, false)}
                  className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  Not picked up
                </button>
              </div>
            </div>
          ))}

          {toPack.length > 0 && (
            <Link
              to="/seller/dashboard?section=Orders"
              onClick={() => setOpen(false)}
              className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
            >
              <p className="text-sm font-semibold text-slate-800">
                {toPack.length} parcel{toPack.length === 1 ? '' : 's'} to pack and release
              </p>
              <p className="mt-1 text-xs text-slate-500">Open the dashboard →</p>
            </Link>
          )}

          {customerThreads.map((thread) => (
            <Link
              key={`${thread.store_id}:${thread.customer_id}`}
              to="/seller/dashboard?section=Messages"
              onClick={() => setOpen(false)}
              className="mb-2 block rounded-lg border border-sky-200 bg-sky-50 p-3"
            >
              <p className="text-sm font-semibold text-sky-950">New customer message · {thread.customer_name || 'Customer'}</p>
              <p className="mt-1 truncate text-xs text-sky-800">{thread.last_message}</p>
              <p className="mt-1 text-xs font-semibold text-sky-900">Reply in Messages</p>
            </Link>
          ))}

          {count === 0 && <p className="px-1 py-3 text-sm text-slate-500">Nothing waiting on you.</p>}
        </div>
      )}
    </div>
  );
}
