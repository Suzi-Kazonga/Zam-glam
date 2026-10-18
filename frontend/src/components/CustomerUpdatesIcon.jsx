// The shopper's bell: news about their orders and refunds.
//
// Every other account had a bell that chimed; a shopper had only the chat. So nothing told
// them their parcel had been packed, collected or delivered, or that a refund had been
// decided — they had to keep opening the order to find out.
//
// It works from what it has already shown. Each parcel's status and each refund decision
// is remembered once seen, on this device, and anything different is an update: counted,
// chimed and listed until the bell is opened. The very first time it looks, it remembers
// everything as it stands, so a shopper is not greeted with their whole history as news.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOrders } from '../api/orderApi';
import { getMyRefundRequests } from '../api/refundApi';
import { STATUS_META } from '../utils/orderStore';
import { isLocalDemoSession } from '../utils/localSession';
import useNotificationChime from '../hooks/useNotificationChime';

const storageKey = (email) => `zamglam:seen-updates:${email || 'anonymous'}`;

function readSeen(email) {
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSeen(email, seen) {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(seen));
  } catch {
    // Storage blocked: updates simply show again next time, which is the safe failure.
  }
}

// Everything worth telling a shopper about, each with the state it is in now.
function currentEvents(orders, refunds) {
  const parcels = orders.flatMap((order) => (order.shipments || []).map((shipment) => ({
    key: `parcel:${shipment.id}`,
    state: shipment.status,
    to: `/orders/${order.id}`,
    title: `Order #${order.id}${shipment.storeName ? ` · ${shipment.storeName}` : ''}`,
    text: STATUS_META[shipment.status]?.label || shipment.status,
  })));

  // A refund is news when it is decided, not while it is still being looked at.
  const decided = refunds
    .filter((refund) => refund.status === 'approved' || refund.status === 'rejected')
    .map((refund) => ({
      key: `refund:${refund.id}`,
      state: refund.status,
      to: `/orders/${refund.order_id}`,
      title: `Refund for order #${refund.order_id}`,
      text: refund.status === 'approved' ? 'Approved' : 'Not approved',
    }));

  return [...parcels, ...decided];
}

export default function CustomerUpdatesIcon() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [open, setOpen] = useState(false);
  const events = useRef([]);

  const load = useCallback(() => {
    if (isLocalDemoSession()) return Promise.resolve();
    return Promise.all([
      getMyOrders().catch(() => []),
      getMyRefundRequests().catch(() => []),
    ]).then(([orders, refunds]) => {
      const now = currentEvents(Array.isArray(orders) ? orders : [], Array.isArray(refunds) ? refunds : []);
      events.current = now;

      let seen = readSeen(user?.email);
      if (!seen) {
        // First look on this device: what is already there is history, not news.
        seen = Object.fromEntries(now.map((event) => [event.key, event.state]));
        writeSeen(user?.email, seen);
      }
      setUpdates(now.filter((event) => seen[event.key] !== event.state));
    });
  }, [user?.email]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  useNotificationChime(updates.length);

  // Opening the bell is seeing the news: it stops counting, though the list stays on
  // screen until the bell is closed.
  const toggle = () => {
    if (!open && updates.length) {
      const seen = { ...(readSeen(user?.email) || {}) };
      events.current.forEach((event) => { seen[event.key] = event.state; });
      writeSeen(user?.email, seen);
    }
    setOpen((current) => !current);
  };

  const shown = open ? updates : [];
  const count = open ? 0 : updates.length;
  const label = count ? `${count} order update${count === 1 ? '' : 's'}` : 'Order updates';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-expanded={open}
        title={label}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-white/10"
      >
        🔔
        {count > 0 && <span className="absolute right-0 top-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{count}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl">
          <p className="px-1 pb-2 text-sm font-bold text-slate-900">Order updates</p>
          {shown.map((update) => (
            <Link
              key={update.key}
              to={update.to}
              onClick={() => { setOpen(false); setUpdates((current) => current.filter((u) => u.key !== update.key)); }}
              className="mb-2 block rounded-lg border border-indigo-100 bg-indigo-50 p-3 hover:bg-indigo-100"
            >
              <p className="text-sm font-semibold text-indigo-950">{update.title}</p>
              <p className="mt-0.5 text-xs text-indigo-800">{update.text}</p>
            </Link>
          ))}
          {!shown.length && <p className="px-1 py-3 text-sm text-slate-500">Nothing new. Your orders are as you last saw them.</p>}
          <Link to="/customer/dashboard?section=Orders" onClick={() => setOpen(false)} className="mt-1 block px-1 text-xs font-semibold text-indigo-700 hover:underline">
            All my orders →
          </Link>
        </div>
      )}
    </div>
  );
}
