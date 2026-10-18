// Refund cases waiting on the administrator, as they appear in Attention.
//
// The header bell counts these, so Attention has to show them too: otherwise the bell says
// "1" and the page it opens has nothing to act on. The decision itself is made in Refunds,
// where the whole conversation between shopper and shop can be read.

import { useEffect, useState } from 'react';
import { getAdminRefundRequests } from '../api/refundApi';

export default function RefundCasesWaiting({ onOpenSection }) {
  const [cases, setCases] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAdminRefundRequests()
      .then((rows) => {
        if (!cancelled) setCases((Array.isArray(rows) ? rows : []).filter((row) => row.status === 'admin_review'));
      })
      .catch(() => { if (!cancelled) setCases([]); });
    return () => { cancelled = true; };
  }, []);

  if (cases === null) return <p className="text-sm text-slate-500">Checking for refund cases…</p>;
  if (!cases.length) return <p className="text-sm text-slate-500">No refund case is waiting for a decision.</p>;

  return (
    <ul className="space-y-2">
      {cases.map((refund) => (
        <li key={refund.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Order #{refund.order_id} · {refund.customer_name} vs {refund.seller_name}</p>
            <p className="mt-0.5 text-xs text-slate-600">
              {refund.reason}
              {refund.seller_recommendation && ` · shop recommends ${refund.seller_recommendation === 'approve' ? 'approving' : 'declining'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenSection?.('Refunds')}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Decide in Refunds
          </button>
        </li>
      ))}
    </ul>
  );
}
