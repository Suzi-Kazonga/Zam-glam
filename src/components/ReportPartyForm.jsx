import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReportableParties, reportParty } from '../api/reportApi';
import { isLocalDemoSession } from '../utils/localSession';

// Lets whoever is looking at an order report another party on it: a customer can report
// the shop or the courier, a shop can report the customer or the courier, a courier can
// report the shop or the customer. Three complaints against the same party flag them to
// an admin.
const REASONS = [
  'Item not as described',
  'Item never arrived',
  'Damaged item',
  'Late dispatch or delivery',
  'Rude or abusive behaviour',
  'Payment or refund problem',
  'Suspected fraud',
  'Other',
];

export default function ReportPartyForm({ orderId }) {
  const { user } = useAuth();
  const [parties, setParties] = useState(null);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !orderId || isLocalDemoSession()) return;
    getReportableParties(orderId).then(setParties).catch(() => setParties(null));
  }, [orderId, user?.email]);

  if (!user || !parties) return null;

  // Everyone on the order except yourself.
  const options = [
    ...(user.role !== 'customer' && parties.customer?.id
      ? [{ role: 'customer', id: parties.customer.id, label: `${parties.customer.name || 'Customer'} (customer)` }]
      : []),
    ...parties.sellers
      .filter(() => user.role !== 'seller')
      .map((s) => ({ role: 'seller', id: s.id, label: `${s.name} (shop)` })),
    ...parties.couriers
      .filter(() => user.role !== 'courier')
      .map((c) => ({ role: 'courier', id: c.id, label: `${c.name} (courier)` })),
  ];

  if (!options.length) return null;

  const submit = async (event) => {
    event.preventDefault();
    const chosen = options.find((o) => `${o.role}:${o.id}` === target) || options[0];
    setBusy(true);
    setMessage('');
    try {
      const result = await reportParty({
        orderId,
        reportedRole: chosen.role,
        reportedId: chosen.id,
        reason,
        details,
      });
      setDone(true);
      setMessage(result.flagged
        ? 'Report submitted. This party has now reached three reports and has been flagged for an admin.'
        : 'Report submitted. An admin will review it.');
    } catch (error) {
      setMessage(error?.error || 'Could not submit that report.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Thank you</p>
        <p className="mt-1 text-sm text-slate-600">{message}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-rose-600 hover:underline">
        Report a problem with this order
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-rose-200 bg-rose-50/40 p-4">
      <p className="text-sm font-semibold text-slate-900">Report a problem</p>
      <p className="mt-1 text-xs text-slate-500">
        Reports go to Zamglam admins. Three separate reports about the same party are flagged for review.
      </p>

      <label className="mt-3 block text-sm font-medium text-slate-700">Who are you reporting?
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          {options.map((o) => <option key={`${o.role}:${o.id}`} value={`${o.role}:${o.id}`}>{o.label}</option>)}
        </select>
      </label>

      <label className="mt-3 block text-sm font-medium text-slate-700">Reason
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>

      <label className="mt-3 block text-sm font-medium text-slate-700">What happened? (optional)
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      </label>

      {message && <p className="mt-2 text-sm text-rose-700">{message}</p>}

      <div className="mt-3 flex gap-2">
        <button disabled={busy} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
          {busy ? 'Submitting…' : 'Submit report'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
          Cancel
        </button>
      </div>
    </form>
  );
}
