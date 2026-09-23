import { useEffect, useState } from 'react';
import { getSellersForReview, reviewSeller } from '../api/storeApi';
import { isLocalDemoSession } from '../utils/localSession';
import { VERIFICATION_LABELS } from './VerificationPanel';

// Admin review queue: check a seller's paperwork, then approve or reject the shop.
// Pending sellers sort first because they are the ones waiting on a decision.
export default function SellerVerificationQueue() {
  const [sellers, setSellers] = useState([]);
  const [notes, setNotes] = useState({});
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    if (isLocalDemoSession()) {
      setMessage('Demo admin accounts cannot review sellers. Sign in as the seeded admin (admin@zamglam.local / ADMIN123456).');
      return;
    }
    getSellersForReview().then(setSellers).catch((error) => setMessage(error?.error || 'Could not load sellers.'));
  };

  useEffect(load, []);

  const decide = async (seller, status) => {
    setBusyId(seller.id);
    setMessage('');
    try {
      await reviewSeller(seller.id, status, notes[seller.id]);
      setMessage(`${seller.shop_name} marked ${status}.`);
      load();
    } catch (error) {
      setMessage(error?.error || 'Could not update that seller.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {message && <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p>}

      {sellers.length ? sellers.map((seller) => {
        const badge = VERIFICATION_LABELS[seller.verification_status] || VERIFICATION_LABELS.pending;
        return (
          <article key={seller.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{seller.shop_name}</p>
                <p className="text-sm text-slate-500">{seller.email} · {seller.phone || 'no phone'}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {seller.product_count} product{seller.product_count === 1 ? '' : 's'} · {seller.document_count} document{seller.document_count === 1 ? '' : 's'}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
            </div>

            {seller.documents?.length ? (
              <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                {seller.documents.map((doc) => (
                  <li key={doc.id} className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="capitalize text-slate-700">{String(doc.type).replace(/_/g, ' ')}</span>
                    {doc.doc_number && <span className="text-xs text-slate-400">#{doc.doc_number}</span>}
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-slate-900 underline">View file</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-amber-700">
                No documents submitted yet — approving without paperwork defeats the check.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                value={notes[seller.id] || ''}
                onChange={(event) => setNotes((current) => ({ ...current, [seller.id]: event.target.value }))}
                placeholder="Note to the seller (optional)"
                className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button type="button" disabled={busyId === seller.id} onClick={() => decide(seller, 'verified')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">Approve</button>
              <button type="button" disabled={busyId === seller.id} onClick={() => decide(seller, 'rejected')} className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">Reject</button>
            </div>
          </article>
        );
      }) : <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">No sellers to review.</p>}
    </div>
  );
}
