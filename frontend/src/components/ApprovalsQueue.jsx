// Applications waiting on an administrator: shops asking to be verified and couriers
// asking to be let in. Both kinds sit in one list, because both are the same job — read
// the application, decide.
//
// Decided applications leave this list. They are not lost: "Decided applications" shows
// every approved and rejected one, each with its tag and a Review button that opens the
// decision again, for the times a decision was made too quickly or on the wrong account.

import { useCallback, useEffect, useState } from 'react';
import { getSellersForReview, reviewSeller } from '../api/storeApi';
import { getAdminUsers, reviewCourierApproval } from '../api/adminApi';
import { isLocalDemoSession } from '../utils/localSession';

const FILTERS = [
  { value: 'all', label: 'All applications' },
  { value: 'shop', label: 'Shops' },
  { value: 'courier', label: 'Couriers' },
];

// A shop is "verified", a courier is "approved" — the same decision under two names, so
// both are flattened to one shape and the wording differs only where it is shown.
const KIND_LABEL = { shop: 'Shop', courier: 'Courier' };
const KIND_TONE = {
  shop: 'bg-purple-100 text-purple-800',
  courier: 'bg-emerald-100 text-emerald-800',
};

function shopToApplication(seller) {
  const status = seller.verification_status === 'verified'
    ? 'approved'
    : seller.verification_status === 'rejected' ? 'rejected' : 'pending';
  return {
    key: `shop:${seller.id}`,
    kind: 'shop',
    id: seller.id,
    name: seller.shop_name || seller.store_name || 'Unnamed shop',
    email: seller.email,
    phone: seller.phone,
    status,
    detail: `${Number(seller.document_count || 0)} document(s) · ${Number(seller.product_count || 0)} product(s)`,
  };
}

function courierToApplication(courier) {
  const status = ['approved', 'rejected'].includes(courier.approval_status) ? courier.approval_status : 'pending';
  return {
    key: `courier:${courier.id}`,
    kind: 'courier',
    id: courier.id,
    name: courier.name || 'Unnamed courier',
    email: courier.email,
    phone: courier.phone,
    status,
    detail: courier.vehicle ? `Vehicle: ${courier.vehicle}` : 'Delivery rider',
  };
}

function StatusTag({ status }) {
  if (status === 'approved') return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Approved</span>;
  if (status === 'rejected') return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">Rejected</span>;
  return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">Waiting</span>;
}

export default function ApprovalsQueue({ onOpenSection }) {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showDecided, setShowDecided] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (isLocalDemoSession()) { setLoading(false); return Promise.resolve(); }
    return Promise.all([
      getSellersForReview().catch(() => []),
      getAdminUsers('couriers').catch(() => []),
    ])
      .then(([sellers, couriers]) => {
        setApplications([
          ...(Array.isArray(sellers) ? sellers : []).map(shopToApplication),
          // A removed account is not an application any more.
          ...(Array.isArray(couriers) ? couriers : []).filter((courier) => !courier.deleted_at).map(courierToApplication),
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // A decision made elsewhere, or a new sign-up, shows up without a page reload — which
    // is also what takes a rejected application off this list at the next refresh.
    const poll = window.setInterval(load, 15000);
    return () => window.clearInterval(poll);
  }, [load]);

  const decide = async (application, decision) => {
    setBusyKey(application.key);
    setMessage('');
    try {
      if (application.kind === 'shop') {
        await reviewSeller(application.id, decision === 'approved' ? 'verified' : 'rejected');
      } else {
        await reviewCourierApproval(application.id, decision);
      }
      setMessage(`${KIND_LABEL[application.kind]} ${application.name} ${decision === 'approved' ? 'approved' : 'rejected'}.`);
      setReviewing(null);
      await load();
    } catch (error) {
      setMessage(error?.error || error?.message || 'That decision could not be saved.');
    } finally {
      setBusyKey(null);
    }
  };

  const ofKind = (list) => (filter === 'all' ? list : list.filter((application) => application.kind === filter));
  const waiting = ofKind(applications.filter((application) => application.status === 'pending'));
  const decided = ofKind(applications.filter((application) => application.status !== 'pending'));
  const shown = showDecided ? decided : waiting;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {showDecided
            ? `${decided.length} application(s) already decided`
            : `${waiting.length} application(s) waiting on you`}
        </p>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="approval-filter">Show</label>
          <select
            id="approval-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-400"
          >
            {FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>

      {message && <p role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{message}</p>}
      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {!loading && shown.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          {showDecided ? 'Nothing has been decided yet.' : 'No applications waiting. Everything has been dealt with.'}
        </p>
      )}

      <ul className="space-y-3">
        {shown.map((application) => (
          <li key={application.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${KIND_TONE[application.kind]}`}>
                {KIND_LABEL[application.kind]}
              </span>
              <span className="text-sm font-semibold text-slate-900">{application.name}</span>
              <StatusTag status={application.status} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {application.email}{application.phone ? ` · ${application.phone}` : ''} · {application.detail}
            </p>

            {/* A decided application is read-only until Review is pressed, so a settled
                decision cannot be changed by one stray click. */}
            {application.status !== 'pending' && reviewing !== application.key && (
              <button
                type="button"
                onClick={() => { setReviewing(application.key); setMessage(''); }}
                className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Review again
              </button>
            )}

            {(application.status === 'pending' || reviewing === application.key) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {application.status !== 'approved' && (
                  <button
                    type="button"
                    disabled={busyKey === application.key}
                    onClick={() => decide(application, 'approved')}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Approve
                  </button>
                )}
                {application.status !== 'rejected' && (
                  <button
                    type="button"
                    disabled={busyKey === application.key}
                    onClick={() => decide(application, 'rejected')}
                    className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    Reject
                  </button>
                )}
                {reviewing === application.key && (
                  <button
                    type="button"
                    onClick={() => setReviewing(null)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setShowDecided((current) => !current)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {showDecided ? 'Back to applications waiting' : `Decided applications (${applications.filter((a) => a.status !== 'pending').length})`}
        </button>
        <button
          type="button"
          onClick={() => onOpenSection?.('Overview')}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Marketplace accounts →
        </button>
      </div>
    </div>
  );
}
