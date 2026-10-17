import { useEffect, useState } from 'react';
import { decideRefundRequest, getAdminRefundRequests, getRefundRequest } from '../api/refundApi';
import RefundCaseThread from './RefundCaseThread';

function errorMessage(error) {
  return error?.response?.data?.error || error?.error || error?.message || 'Could not load refund requests.';
}

export default function AdminRefundQueue() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRequests = () => getAdminRefundRequests()
    .then((rows) => setRequests(Array.isArray(rows) ? rows : []))
    .catch((loadError) => setError(errorMessage(loadError)))
    .finally(() => setLoading(false));

  useEffect(() => { loadRequests(); }, []);

  const openRequest = async (id) => {
    setError('');
    try {
      setSelected(await getRefundRequest(id));
      setNote('');
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  };

  const finalize = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const updated = await decideRefundRequest(selected.id, decision, note);
      setSelected(updated);
      setRequests((current) => current.map((request) => request.id === updated.id
        ? { ...request, ...updated }
        : request));
      setNote('');
    } catch (decisionError) {
      setError(errorMessage(decisionError));
    } finally {
      setSaving(false);
    }
  };

  const refreshConversation = async () => {
    const updated = await getRefundRequest(selected.id);
    setSelected(updated);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.4fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">Refund decision queue</h2>
        <p className="mt-1 text-sm text-slate-500">Review the customer and seller conversation and the seller’s recommendation before deciding.</p>
        {loading && <p className="mt-4 text-sm text-slate-500">Loading requests…</p>}
        {!loading && !requests.length && <p className="mt-4 text-sm text-slate-500">No refund requests have been filed.</p>}
        <div className="mt-3 space-y-2">
          {requests.map((request) => (
            <button
              type="button"
              key={request.id}
              onClick={() => openRequest(request.id)}
              className={`block w-full rounded-lg border p-3 text-left transition ${selected?.id === request.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <span className="block text-sm font-semibold text-slate-800">Order #{request.order_id} · {request.customer_name}</span>
              <span className="mt-1 block text-xs capitalize text-slate-500">{request.reason} · {request.status.replace(/_/g, ' ')}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-3">
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {selected ? (
          <RefundCaseThread refund={selected} onRefresh={refreshConversation} readOnly>
            {selected.status === 'seller_review' && (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Waiting for the seller to submit a recommendation. A final decision is not available yet.</p>
            )}
            {selected.status === 'admin_review' && (
              <form onSubmit={finalize} className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
                <h4 className="text-sm font-semibold text-slate-800">Make the final decision</h4>
                <p className="mt-1 text-xs text-slate-600">This records the case outcome only; no payment is transferred by the system.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Decision
                    <select value={decision} onChange={(event) => setDecision(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                      <option value="approved">Approve request</option>
                      <option value="rejected">Decline request</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Decision note
                    <textarea required rows="3" maxLength="4000" value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3" />
                  </label>
                </div>
                <button type="submit" disabled={saving || !note.trim()} className="mt-3 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {saving ? 'Saving…' : 'Record final decision'}
                </button>
              </form>
            )}
          </RefundCaseThread>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Choose a refund request to review its conversation and details.</p>
        )}
      </div>
    </div>
  );
}
