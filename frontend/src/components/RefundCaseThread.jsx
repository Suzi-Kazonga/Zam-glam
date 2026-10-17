import { useState } from 'react';

const STATUS_LABELS = {
  seller_review: 'Waiting for seller',
  admin_review: 'Waiting for admin decision',
  approved: 'Approved',
  rejected: 'Declined',
};

function errorMessage(error) {
  return error?.response?.data?.error || error?.error || error?.message || 'Could not send your message.';
}

export default function RefundCaseThread({ refund, onSendMessage, onRefresh, readOnly = false, children }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const isOpen = ['seller_review', 'admin_review'].includes(refund.status);

  const send = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      await onSendMessage(body);
      setDraft('');
    } catch (sendError) {
      setError(errorMessage(sendError));
    } finally {
      setSending(false);
    }
  };

  const refresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    setError('');
    try {
      await onRefresh();
    } catch (refreshError) {
      setError(errorMessage(refreshError));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">Refund request · Order #{refund.order_id}</h3>
          <p className="mt-1 text-sm text-slate-600">{refund.reason}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
          {STATUS_LABELS[refund.status] || refund.status}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{refund.details}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
        <span>Customer: {refund.customer_name || 'Customer'}</span>
        <span>Shop: {refund.seller_name || 'Seller'}</span>
        <span>Parcel #{refund.shipment_id}</span>
      </div>
      {(refund.seller_note || refund.admin_decision_note) && (
        <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          {refund.seller_note && <p><strong>Seller recommendation:</strong> {refund.seller_recommendation} — {refund.seller_note}</p>}
          {refund.admin_decision_note && <p><strong>Admin decision:</strong> {refund.admin_decision_note}</p>}
        </div>
      )}

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h4 className="text-sm font-semibold text-slate-800">Customer and seller conversation</h4>
        {onRefresh && (
          <button type="button" onClick={refresh} disabled={refreshing} className="mt-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {refreshing ? 'Refreshing…' : 'Refresh conversation'}
          </button>
        )}
        <div className="mt-3 max-h-72 space-y-3 overflow-y-auto">
          {refund.messages?.length ? refund.messages.map((message) => (
            <article key={message.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700">
                  {message.sender_name || (message.sender_role === 'seller' ? 'Seller' : 'Customer')}
                </p>
                <time className="text-xs text-slate-400">{new Date(message.created_at).toLocaleString()}</time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{message.body}</p>
            </article>
          )) : <p className="text-sm text-slate-500">No messages yet.</p>}
        </div>

        {children}

        {!readOnly && isOpen && (
          <form onSubmit={send} className="mt-4">
            <label htmlFor={`refund-message-${refund.id}`} className="sr-only">Write a message about this refund</label>
            <textarea
              id={`refund-message-${refund.id}`}
              rows="3"
              maxLength="4000"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a message to the other party"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
            <div className="mt-2 flex justify-end">
              <button type="submit" disabled={!draft.trim() || sending} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </form>
        )}
        {!isOpen && <p className="mt-3 text-sm text-slate-500">This conversation is closed because the admin made a final decision.</p>}
      </div>
    </section>
  );
}
