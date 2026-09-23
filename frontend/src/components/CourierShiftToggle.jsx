// A rider’s on-duty switch. Only riders on duty are shown parcels to collect.

import { useEffect, useState } from 'react';
import { getShift, setShift } from '../api/orderApi';
import { isLocalDemoSession } from '../utils/localSession';

// A courier's duty switch, shared by their dashboard and their profile so both always
// agree. A courier still carrying a parcel cannot clock off: only the courier who
// collected a parcel may deliver it, so leaving mid-delivery would strand it.
export default function CourierShiftToggle({ onChange, compact = false }) {
  const [state, setState] = useState({ on_shift: false, carrying: 0 });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (isLocalDemoSession()) return;
    getShift().then(setState).catch(() => {});
  };

  useEffect(load, []);

  const toggle = async () => {
    setBusy(true);
    setMessage('');
    try {
      const next = await setShift(!state.on_shift);
      setState((current) => ({ ...current, on_shift: next.on_shift }));
      setMessage(next.on_shift
        ? 'You are on duty — parcels waiting for pickup are shown to you.'
        : 'You are off duty. You will not be shown the pool or given parcels.');
      onChange?.(next.on_shift);
      load();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not change your duty status.');
      load();
    } finally {
      setBusy(false);
    }
  };

  const blocked = !state.on_shift ? false : state.carrying > 0;

  return (
    <div className={`rounded-lg border p-4 ${state.on_shift ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{state.on_shift ? 'On duty' : 'Off duty'}</p>
          {!compact && (
            <p className="text-sm text-slate-500">
              {state.on_shift
                ? 'You can see parcels waiting for pickup, and unclaimed parcels can be assigned to you.'
                : 'Go on duty to see parcels waiting for pickup.'}
            </p>
          )}
          {blocked && (
            <p className="mt-1 text-sm font-semibold text-rose-600">
              Carrying {state.carrying} parcel{state.carrying === 1 ? '' : 's'} — deliver {state.carrying === 1 ? 'it' : 'them'} before going off duty.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={busy || blocked}
          title={blocked ? 'Deliver the parcels you are carrying first' : undefined}
          className={`rounded-lg px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${state.on_shift ? 'bg-slate-700 hover:bg-slate-800' : 'bg-emerald-700 hover:bg-emerald-800'}`}
        >
          {busy ? 'Saving…' : state.on_shift ? 'Go off duty' : 'Go on duty'}
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
    </div>
  );
}
