import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingRegistrations } from '../api/adminApi';
import { isLocalDemoSession } from '../utils/localSession';

// Admin equivalent of the customer's cart badge, the seller's order badge and the
// courier's parcel badge: how many registrations are waiting on a decision — shops that
// have submitted verification documents, and courier sign-ups not yet let in.
export default function AdminApprovalsIcon() {
  const [pending, setPending] = useState({ shops: [], couriers: [], total: 0 });

  useEffect(() => {
    if (isLocalDemoSession()) return undefined;

    let cancelled = false;
    const check = () => {
      getPendingRegistrations()
        .then((data) => { if (!cancelled) setPending(data); })
        .catch(() => {});
    };

    check();
    const poll = window.setInterval(check, 10000);
    return () => { cancelled = true; window.clearInterval(poll); };
  }, []);

  const count = pending.total || 0;
  const title = count
    ? `${pending.shops.length} shop${pending.shops.length === 1 ? '' : 's'} and ${pending.couriers.length} courier${pending.couriers.length === 1 ? '' : 's'} awaiting approval`
    : 'No registrations waiting';

  return (
    <Link
      to="/admin/dashboard?tab=approvals"
      aria-label={title}
      title={title}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-white/10"
    >
      🔔
      {count > 0 && (
        <span className="absolute right-0 top-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{count}</span>
      )}
    </Link>
  );
}
