// The rider’s header badge: how many parcels are waiting to be collected.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableParcels } from '../api/orderApi';
import { isLocalDemoSession } from '../utils/localSession';

// Courier equivalent of the cart badge: how many parcels shops have released that no
// courier has claimed yet, so a driver notices new work without sitting on the dashboard.
export default function DeliveryIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isLocalDemoSession()) return undefined;

    let cancelled = false;
    const check = () => {
      getAvailableParcels()
        .then((parcels) => {
          if (cancelled) return;
          setCount(parcels.length);
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
      aria-label={`${count} parcel${count === 1 ? '' : 's'} available to pick up`}
      title={count ? `${count} parcel${count === 1 ? '' : 's'} available to pick up` : 'No parcels waiting for pickup'}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-white/10"
    >
      📦
      {count > 0 && (
        <span className="absolute right-0 top-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{count}</span>
      )}
    </Link>
  );
}
