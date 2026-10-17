import { useEffect, useState } from 'react';
import {
  getMyRefundRequests,
  getRefundRequest,
  sendRefundMessage,
  submitRefundRecommendation,
} from '../api/refundApi';
import { isLocalDemoSession } from '../utils/localSession';
import RefundCaseThread from './RefundCaseThread';

function errorMessage(error) {
  return error?.response?.data?.error || error?.error || error?.message || 'Could not load refund requests.';
}

export default function SellerRefundInbox() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [recommendation, setRecommendation] = useState('approve');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRequests = () => getMyRefundRequests()
    .then((rows) => setRequests(Array.isArray(rows) ? rows : []))
    .catch((loadError) => setError(errorMessage(loadError)))
    .finally(() => setLoading(false));

  useEffect(() => {
    if (isLocalDemoSession()) {
      setLoading(false);
      return;
    }
    loadRequests();
  }, []);

  const openRequest = async (id) => {
    setError('');
    try {
      setSelected(await getRefundRequest(id));
      setNote('');
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  };

  const updateRequest = (updated) => {
    setSelected(updated);
    setRequests((current) => current.map((request) => request.id === updated.id
      ? { ...request, ...updated }
      : request));
  };

  const sendMessage = async (body) => {
    updateRequest(await sendRefundMessage(selected.id, body));
  };

  const refreshConversation = async () => {
    updateRequest(await getRefundRequest(selected.id));
  };

  const submitRecommendation = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      updateRequest(await submitRefundRecommendation(selected.id, recommendation, note));
      setNote('');
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (isLocalDemoSession()) {
    return <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Sign in to a live seller account to manage refund requests.</p>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.4fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">Customer refund requests</h2>
        <p className="mt-1 text-sm text-slate-500">Discuss the issue with the customer, then recommend a resolution for admin review.</p>
        {loading && <p className="mt-4 text-sm text-slate-500">Loading requests…</p>}
        {!loading && !requests.length && <p className="mt-4 text-sm text-slate-500">No refund requests yet.</p>}
        <div className="mt-3 space-y-2">
          {requests.map((request) => (
            <button
              type="button"
              key={request.id}
              onClick={() => openRequest(request.id)}
              className={`block w-full rounded-lg border p-3 text-left transition ${selected?.id === request.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <span className="block text-sm font-semibold text-slate-800">Order #{request.order_id} · {request.customer_name}</span>
              <span className="mt-1 block text-xs text-slate-500">{request.reason} · {request.status.replace(/_/g, ' ')}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-3">
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {selected ? (
          <RefundCaseThread refund={selected} onSendMessage={sendMessage} onRefresh={refreshConversation}>
            {selected.status === 'seller_review' && (
              <form onSubmit={submitRecommendation} className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
                <h4 className="text-sm font-semibold text-slate-800">Recommend a resolution</h4>
                <p className="mt-1 text-xs text-slate-600">The admin reviews your recommendation and makes the final decision. This does not move money.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Recommendation
                    <select value={recommendation} onChange={(event) => setRecommendation(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                      <option value="approve">Recommend approval</option>
                      <option value="reject">Recommend decline</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Note for the admin
                    <textarea required rows="3" maxLength="4000" value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3" />
                  </label>
                </div>
                <button type="submit" disabled={saving || !note.trim()} className="mt-3 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {saving ? 'Sending…' : 'Send recommendation to admin'}
                </button>
              </form>
            )}
          </RefundCaseThread>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Choose a request to read the customer’s concern and reply.</p>
        )}
      </div>
    </div>
  );
}
