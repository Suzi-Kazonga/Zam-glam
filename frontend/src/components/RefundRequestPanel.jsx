import { useEffect, useState } from 'react';
import { createRefundRequest, getRefundForShipment, sendRefundMessage } from '../api/refundApi';
import { isLocalDemoSession } from '../utils/localSession';
import RefundCaseThread from './RefundCaseThread';

const REASONS = ['Item not received', 'Wrong or missing item', 'Item damaged or defective', 'Other'];

function errorMessage(error) {
  return error?.response?.data?.error || error?.error || error?.message || 'Could not load the refund request.';
}

export default function RefundRequestPanel({ shipment }) {
  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let current = true;
    if (isLocalDemoSession()) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    getRefundForShipment(shipment.id)
      .then((currentRefund) => {
        if (current) setRefund(currentRefund);
      })
      .catch((loadError) => {
        if (current) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [shipment.id]);

  const openRequest = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await createRefundRequest({ shipment_id: shipment.id, reason, details });
      setRefund(created);
      setFormOpen(false);
      setDetails('');
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const sendMessage = async (body) => {
    const updated = await sendRefundMessage(refund.id, body);
    setRefund(updated);
  };

  const refreshConversation = async () => {
    const updated = await getRefundForShipment(shipment.id);
    if (updated) setRefund(updated);
  };

  return (
    <section className="mt-5 border-t border-slate-100 pt-5">
      <h3 className="font-bold text-slate-900">Refund help</h3>
      <p className="mt-1 text-sm text-slate-600">
        Discuss the issue with the shop. The shop recommends a solution and an admin makes the final decision.
      </p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
        An approval records the decision only. No money is transferred by this system.
      </p>
      {loading && <p className="mt-3 text-sm text-slate-500">Checking refund requests…</p>}
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
      {isLocalDemoSession() && <p className="mt-3 text-sm text-slate-500">Sign in to a live customer account to open a refund request.</p>}

      {!loading && !isLocalDemoSession() && refund && (
        <div className="mt-4">
          <RefundCaseThread refund={refund} onSendMessage={sendMessage} onRefresh={refreshConversation} />
        </div>
      )}

      {!loading && !isLocalDemoSession() && !refund && shipment.status !== 'delivered' && (
        <p className="mt-3 text-sm text-slate-500">You can open a refund request after this parcel is delivered.</p>
      )}

      {!loading && !isLocalDemoSession() && !refund && shipment.status === 'delivered' && !formOpen && (
        <button type="button" onClick={() => setFormOpen(true)} className="mt-4 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-50">
          Open a refund request
        </button>
      )}

      {formOpen && (
        <form onSubmit={openRequest} className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4">
          <div>
            <label htmlFor={`refund-reason-${shipment.id}`} className="mb-1 block text-sm font-semibold text-slate-700">What went wrong?</label>
            <select id={`refund-reason-${shipment.id}`} value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              {REASONS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`refund-details-${shipment.id}`} className="mb-1 block text-sm font-semibold text-slate-700">Describe the issue</label>
            <textarea
              id={`refund-details-${shipment.id}`}
              rows="4"
              minLength="1"
              maxLength="4000"
              required
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Include the details the shop needs to understand your concern."
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button type="submit" disabled={saving || !details.trim()} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
