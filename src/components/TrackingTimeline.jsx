import { STATUS_META, TRACK_STEPS } from '../utils/orderStore';

export default function TrackingTimeline({ order }) {
  const currentIndex = Math.max(0, TRACK_STEPS.indexOf(order?.status));

  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {TRACK_STEPS.map((step, index) => {
        const reached = index <= currentIndex;
        const current = index === currentIndex;
        const event = (order?.tracking || []).find((item) => item.status === step);
        return (
          <li key={step} className={`rounded-lg border p-3 ${current ? 'border-indigo-600 bg-indigo-50' : reached ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
            <p className={`text-xs font-semibold uppercase tracking-widest ${reached ? 'text-indigo-600' : 'text-slate-400'}`}>
              {index + 1}. {STATUS_META[step].label}
            </p>
            <p className="mt-2 text-sm text-slate-600">{event?.note || STATUS_META[step].note}</p>
            <p className="mt-2 text-xs text-slate-400">{event?.at || (reached ? '' : 'Waiting')}</p>
          </li>
        );
      })}
    </ol>
  );
}
