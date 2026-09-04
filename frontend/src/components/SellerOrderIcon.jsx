import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/orderApi';
import { isLocalDemoSession } from '../utils/localSession';

// Seller equivalent of the courier's parcel badge and the customer's cart: how many of
// this shop's parcels are still waiting on them (to pack, or to hand to the courier).
// Shown in the header and topbar so it follows the seller across every screen.
const NEEDS_ACTION = ['placed', 'processing'];

export default function SellerOrderIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isLocalDemoSession()) return undefined;

    let cancelled = false;
    const check = () => {
      getMyOrders()
        .then((orders) => {
          if (cancelled) return;
          setCount(orders.filter((order) => NEEDS_ACTION.includes(order.status)).length);
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
      to="/seller/dashboard"
      aria-label={`${count} order${count === 1 ? '' : 's'} need attention`}
      title={count ? `${count} order${count === 1 ? '' : 's'} need your attention` : 'No orders waiting on you'}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-white/10"
    >
      🧾
      {count > 0 && (
        <span className="absolute right-0 top-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{count}</span>
      )}
    </Link>
  );
}
