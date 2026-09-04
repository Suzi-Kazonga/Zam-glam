import { formatZmwPrice } from '../utils/currency';

export default function CourierInfo({ delivery }) {
  if (!delivery) return null;

  const progress = Math.min(100, Number(delivery.progress || 0));

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-bold text-lg text-slate-900">Courier information</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <p><span className="font-semibold">Provider:</span> {delivery.provider || 'Zamglam Courier'}</p>
        {delivery.contact_available === false ? (
          <p className="rounded bg-white px-3 py-2 text-xs text-slate-500">
            No courier has collected this parcel yet. Whoever picks it up is shown here, with their phone number.
          </p>
        ) : (
          <>
            <p><span className="font-semibold">Driver:</span> {delivery.driver_name}</p>
            {delivery.driver_phone && (
              <p>
                <span className="font-semibold">Phone:</span>{' '}
                <a href={`tel:${delivery.driver_phone}`} className="font-semibold text-indigo-700 hover:underline">{delivery.driver_phone}</a>
              </p>
            )}
          </>
        )}
        <p><span className="font-semibold">Price:</span> {formatZmwPrice(delivery.price)}</p>
        <p><span className="font-semibold">Distance:</span> {delivery.distance}</p>
        <p><span className="font-semibold">Route:</span> {delivery.direction}</p>
        <p><span className="font-semibold">ETA:</span> {delivery.eta || 'Pending pickup'}</p>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Delivery progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
