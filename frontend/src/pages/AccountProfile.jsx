// "My account" — the signed-in person’s own details, whatever kind of account they have.

import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardForRole } from '../utils/authRedirect';
import CourierShiftToggle from '../components/CourierShiftToggle';

const customerPolicies = [
  { label: 'Shipping Info', href: '/policies#shipping' },
  { label: 'Return Policy', href: '/policies#returns' },
  { label: 'Privacy & Cookie Policy', href: '/policies#privacy' },
  { label: 'Refund', href: '/policies#refunds' },
  { label: 'Payment Method', href: '/policies#payment' },
];

export default function AccountProfile() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="p-10 text-center">Loading your account...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const initials = user.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';
  const location = user.location || user.address || 'Lusaka, Zambia';

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow-lg">
              {initials}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{user.role} account</p>
              <h1 className="mt-1 text-3xl font-black text-slate-900">{user.name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={dashboardForRole(user.role)} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
              Dashboard
            </Link>
            <button type="button" onClick={() => { logout(); navigate('/'); }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Account details</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Name</dt>
            <dd className="mt-2 font-semibold text-slate-900">{user.name || 'Not provided'}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Email</dt>
            <dd className="mt-2 font-semibold text-slate-900">{user.email || 'Not provided'}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Phone</dt>
            <dd className="mt-2 font-semibold text-slate-900">{user.phone || 'Not provided'}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Location</dt>
            <dd className="mt-2 font-semibold text-slate-900">{location}</dd>
          </div>
        </dl>

        {user.role === 'courier' && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Duty status</h2>
            <CourierShiftToggle />
          </div>
        )}
      </section>

      {user.role === 'courier' && (
        <section aria-labelledby="courier-guide-title" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">New courier guide</p>
          <h2 id="courier-guide-title" className="mt-1 text-lg font-bold text-slate-900">How to complete a delivery</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li>
              <span className="font-semibold">1. Go on duty.</span> Open your <Link to="/courier/dashboard" className="font-semibold text-emerald-800 underline underline-offset-2">courier dashboard</Link> and switch your duty status on to see available parcels.
            </li>
            <li>
              <span className="font-semibold">2. Request a pickup.</span> Choose a parcel in <Link to="/courier/dashboard?section=Available" className="font-semibold text-emerald-800 underline underline-offset-2">Available</Link>. Wait for the shop to confirm the handover before leaving with it.
            </li>
            <li>
              <span className="font-semibold">3. Deliver and finish the job.</span> Follow the customer’s delivery details, then mark the parcel delivered in <Link to="/courier/dashboard?section=Deliveries" className="font-semibold text-emerald-800 underline underline-offset-2">Deliveries</Link>.
            </li>
          </ol>
          <Link to="/courier/dashboard?section=Completed" className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline underline-offset-2">
            Review completed deliveries
          </Link>
        </section>
      )}

      {user.role === 'customer' && (
        <nav aria-label="Customer policies" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Customer policies</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {customerPolicies.map((policy) => (
              <Link key={policy.label} to={policy.href} className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline">
                {policy.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </main>
  );
}
