import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccountProfile() {
  const { user } = useAuth();

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
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white shadow-lg">
              {initials}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">Account profile</p>
              <h1 className="mt-2 text-3xl font-bold">{user.name || 'Your profile'}</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Name</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user.name || 'Not provided'}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user.email || 'Not provided'}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Phone number</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user.phone || 'Not provided'}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Location</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{location}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
          <Link to="/" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:border-indigo-600 hover:text-indigo-600">
            Back to home
          </Link>
          <Link to="/customer/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700">
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
