// The administrator’s header badge: sign-ups waiting for a decision, and parties with
// enough complaints to need looking at.

import { useEffect, useState } from 'react';
import useNotificationChime from '../hooks/useNotificationChime';
import { Link } from 'react-router-dom';
import { getPendingRegistrations } from '../api/adminApi';
import { getReportSummary } from '../api/reportApi';
import { getAdminRefundRequests } from '../api/refundApi';
import { isLocalDemoSession } from '../utils/localSession';

// Admin equivalent of the customer's cart badge, the seller's order badge and the
// courier's parcel badge: how many registrations are waiting on a decision — shops that
// have submitted verification documents, and courier sign-ups not yet let in.
export default function AdminApprovalsIcon() {
  const [pending, setPending] = useState({ shops: [], couriers: [], total: 0 });
  // Parties at or past three complaints also need the admin's attention.
  const [flagged, setFlagged] = useState(0);
  const [refundCases, setRefundCases] = useState(0);

  useEffect(() => {
    if (isLocalDemoSession()) return undefined;

    let cancelled = false;
    const check = () => {
      getPendingRegistrations()
        .then((data) => { if (!cancelled) setPending(data); })
        .catch(() => {});
      // A refund case waiting on a decision is work the console must show, like an
      // approval or a flag — otherwise it sits unseen until somebody opens Refunds.
      getAdminRefundRequests()
        .then((rows) => { if (!cancelled) setRefundCases((Array.isArray(rows) ? rows : []).filter((row) => row.status === 'admin_review').length); })
        .catch(() => {});
      getReportSummary()
        .then((rows) => { if (!cancelled) setFlagged(rows.filter((r) => r.report_count >= 3 && r.account_status !== 'suspended').length); })
        .catch(() => {});
    };

    check();
    const poll = window.setInterval(check, 10000);
    return () => { cancelled = true; window.clearInterval(poll); };
  }, []);

  const count = (pending.total || 0) + flagged + refundCases;
  // Approvals and flags arrive while the console sits open on another tab.
  useNotificationChime(count);
  const title = count
    ? `${pending.shops.length} shop(s) and ${pending.couriers.length} courier(s) awaiting approval`
      + (flagged ? `, ${flagged} party(ies) with 3+ complaints` : '')
      + (refundCases ? `, ${refundCases} refund case(s) to decide` : '')
    : 'Nothing waiting';

  return (
    <Link
      to="/admin/dashboard?section=Attention"
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
