import { useEffect, useState } from 'react';
import { getUnclaimedParcels } from '../api/orderApi';
import { isLocalDemoSession } from '../utils/localSession';
import { formatWaiting, isOverdue, ESCALATION_MINUTES } from '../utils/waiting';
import { formatZmwPrice } from '../utils/currency';

// Parcels shops have released that nobody has collected. Anything past the escalation
// threshold is assigned automatically, but an admin still needs to see work that stalls —
// especially when no courier is on duty to receive it.
export default function UnclaimedParcels() {
  const [parcels, setParcels] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isLocalDemoSession()) {
      setMessage('Sign in as the seeded admin (admin@zamglam.local / ADMIN123456) to see stalled parcels.');
      return undefined;
    }
    const load = () => getUnclaimedParcels().then(setParcels).catch((error) => setMessage(error?.error || 'Could not load parcels.'));
    load();
    const poll = window.setInterval(load, 15000);
    return () => window.clearInterval(poll);
  }, []);

  const overdue = parcels.filter((parcel) => isOverdue(parcel.released_at));

  return (
    <div className="space-y-4">
      {message && <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p>}

      <p className="text-sm text-slate-500">
        {parcels.length} parcel{parcels.length === 1 ? '' : 's'} released and not yet collected
        {overdue.length > 0 && <span className="font-semibold text-rose-600"> · {overdue.length} past {ESCALATION_MINUTES} minutes</span>}
      </p>

      {parcels.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 text-slate-400">
              <tr><th className="py-3">Parcel</th><th>Shop</th><th>Destination</th><th>Waiting</th><th>Assigned</th><th>Fee</th></tr>
            </thead>
            <tbody>
              {parcels.map((parcel) => (
                <tr key={parcel.shipment_id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 font-semibold">#{parcel.shipment_id} <span className="font-normal text-slate-400">order {parcel.order_id}</span></td>
                  <td>{parcel.store_name}</td>
                  <td className="text-slate-500">{parcel.location || parcel.address}</td>
                  <td className={isOverdue(parcel.released_at) ? 'font-semibold text-rose-600' : 'text-slate-600'}>
                    {formatWaiting(parcel.released_at)}
                  </td>
                  <td>
                    {parcel.courier_name
                      ? <span className="text-slate-700">{parcel.courier_name}{parcel.escalated_at ? ' (escalated)' : ''}</span>
                      : <span className="text-amber-700">unclaimed</span>}
                  </td>
                  <td>{formatZmwPrice(parcel.delivery_fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !message && <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">Nothing is waiting for a courier.</p>}
    </div>
  );
}
