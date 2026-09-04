import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/orderApi';
import { isLocalDemoSession } from '../utils/localSession';

// Courier equivalent of the cart badge: shows how many parcels are waiting to be
// delivered right now (the shop has handed them over) so a driver notices new work
// without sitting on the dashboard.
export default function DeliveryIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isLocalDemoSession()) return undefined;

    let cancelled = false;
    const check = () => {
      getMyOrders()
        .then((parcels) => {
          if (cancelled) return;
          setCount(parcels.filter((parcel) => parcel.status === 'shipped').length);
        })
        .catch(() => {});
    };

    check();
    const poll = window.setInterval(check, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, []);

  return (
    <Link
      to="/courier/dashboard"
      aria-label={`${count} parcel${count === 1 ? '' : 's'} ready to deliver`}
      title={count ? `${count} parcel${count === 1 ? '' : 's'} ready to deliver` : 'No parcels waiting'}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-white/10"
    >
      📦
      {count > 0 && (
        <span className="absolute right-0 top-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{count}</span>
      )}
    </Link>
  );
}
