// The Details button on a shop's order: who the parcel is for, and who is carrying it.
//
// The order list deliberately leaves contact details out. They are fetched here, one
// parcel at a time, only when the shop asks, and only for a parcel that is its own — the
// server refuses anybody else.

import { useState } from 'react';
import { getShipmentDetails } from '../../api/orderApi';

const money = (value) => `K${Number(value || 0).toFixed(2)}`;

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-800">{value || 'Not given'}</dd>
    </div>
  );
}

export default function OrderDetailsButton({ shipmentId, orderId }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Read afresh each time it is opened: the courier may have changed since last time.
  const show = async () => {
    setOpen(true);
    setError('');
    setLoading(true);
    try {
      setDetails(await getShipmentDetails(shipmentId));
    } catch (problem) {
      setError(problem?.response?.data?.error || problem?.error || 'Those details could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  if (!shipmentId) return null;

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Details
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label={`Details of order #${orderId}`}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Order #{orderId}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Who it is for, and who is carrying it</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>

            {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
            {error && <p role="alert" className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p>}

            {details && !loading && (
              <div className="mt-5 space-y-5">
                <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <h3 className="text-sm font-bold text-indigo-900">Customer</h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Name" value={details.customer?.name} />
                    <Field label="Phone" value={details.customer?.phone} />
                    <Field label="Email" value={details.customer?.email} />
                    <Field label="Town" value={details.customer?.location} />
                    <div className="sm:col-span-2"><Field label="Delivery address" value={details.customer?.address} /></div>
                  </dl>
                </section>

                <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <h3 className="text-sm font-bold text-emerald-900">Courier</h3>
                  {details.courier ? (
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="Name" value={details.courier.name} />
                      <Field label="Phone" value={details.courier.phone} />
                      <Field label="Email" value={details.courier.email} />
                      <Field label="Vehicle" value={details.courier.vehicle} />
                    </dl>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">No courier yet. One appears here as soon as a rider asks to collect this parcel.</p>
                  )}
                </section>

                <dl className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
                  <Field label="Delivery fee" value={money(details.delivery_fee)} />
                  <Field label="Distance" value={details.distance} />
                  <Field label="Payment" value={details.payment_method} />
                </dl>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
