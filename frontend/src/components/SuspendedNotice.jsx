// The notice a suspended account sees on every page, saying why and since when.

import { useEffect, useState } from 'react';
import { getMyStanding } from '../api/reportApi';
import { useAuth } from '../context/AuthContext';
import { isLocalDemoSession } from '../utils/localSession';

// Shown to a suspended account on every page. A suspended user can still sign in and
// read — that is how they find out why — but the actions are refused by the server.
export default function SuspendedNotice() {
  const { user } = useAuth();
  const [standing, setStanding] = useState(null);

  useEffect(() => {
    if (!user || user.role === 'admin' || isLocalDemoSession()) return undefined;

    let cancelled = false;
    const check = () => {
      getMyStanding()
        .then((data) => { if (!cancelled) setStanding(data); })
        .catch(() => {});
    };
    check();
    // Picks up a reinstatement without needing a sign-out.
    const poll = window.setInterval(check, 20000);
    return () => { cancelled = true; window.clearInterval(poll); };
  }, [user?.email, user?.role]);

  if (!standing?.suspended) return null;

  return (
    <div className="border-b-2 border-rose-700 bg-rose-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <span className="rounded-md bg-rose-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
          Suspended
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-rose-900">
            Your account has been suspended and cannot place orders, list items or take deliveries.
          </p>
          <p className="text-sm text-rose-800">
            Reason: {standing.reason || 'Repeated complaints'}
            {standing.suspended_at && ` · ${new Date(standing.suspended_at).toLocaleDateString()}`}
          </p>
          <p className="mt-1 text-xs text-rose-700">
            You can still sign in and view your history. Contact Zamglam support if you believe this is a mistake.
          </p>
        </div>
      </div>
    </div>
  );
}
