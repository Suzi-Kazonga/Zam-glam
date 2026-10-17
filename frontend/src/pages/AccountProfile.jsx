// "My account" — the signed-in person’s own details, whatever kind of account they have.

import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOrders } from '../api/orderApi';
import { isLocalDemoSession } from '../utils/localSession';
import { dashboardForRole } from '../utils/authRedirect';
import CourierShiftToggle from '../components/CourierShiftToggle';
import ReportProblemButton from '../components/ReportProblemButton';
import CustomerServicePanel from '../components/CustomerServicePanel';
import useOpenProblems from '../hooks/useOpenProblems';
import useNotificationChime from '../hooks/useNotificationChime';

const tabs = [
  { id: 'unpaid', label: 'Unpaid', icon: '▣' },
  { id: 'processing', label: 'Processing', icon: '▤' },
  { id: 'shipped', label: 'Shipped', icon: '▨' },
  { id: 'review', label: 'Review', icon: '◫' },
  { id: 'returns', label: 'Returns', icon: '↩' },
];

const policyGroups = [
  {
    title: 'Policy',
    items: [
      { label: 'Shipping Info', href: '/policies#shipping' },
      { label: 'Return Policy', href: '/policies#returns' },
      { label: 'Privacy & Cookie Policy', href: '/policies#privacy' },
      { label: 'Refund', href: '/policies#refunds' },
      { label: 'Payment Method', href: '/policies#payment' },
      { label: 'User Guide', href: '/policies#guide' },
    ],
  },
  {
    title: 'Accessibility',
    items: [
      { label: 'Pop-up & Message Control', href: '/policies#accessibility' },
    ],
  },
];

export default function AccountProfile() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('processing');
  const [showCustomerService, setShowCustomerService] = useState(false);
  // What is waiting for an administrator. The same figure rides on the profile icon in
  // the header, which is also where the chime comes from, so this one stays silent.
  // setOpenProblems lets the panel drop the count the moment one is marked done.
  const { open: openProblems, setOpen: setOpenProblems } = useOpenProblems();

  useEffect(() => {
    if (user?.email && !isLocalDemoSession()) {
      getMyOrders()
        .then((customerOrders) => {
          const sorted = [...customerOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(sorted);
        })
        .catch(() => setOrders([]));
    }
  }, [user]);

  // The signed-in account is read back from storage after the first render, so this has
  // to wait for it. Without the check, opening /account directly — or refreshing on it —
  // threw a signed-in person to the login page.
  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading your account...</div>;
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
    <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_260px]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-bold text-white">
                {initials}
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{user.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{user.role}</p>
              </div>
            </div>

            <div className="space-y-2 text-lg font-medium text-slate-700">
              {/* Customer service opens the panel below: for an administrator the queue of
                  reported problems, for everybody else what they have reported. The count
                  is of problems still waiting, and the device chimes as new ones arrive. */}
              <button
                type="button"
                onClick={() => setShowCustomerService((current) => !current)}
                aria-expanded={showCustomerService}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-slate-100 ${showCustomerService ? 'bg-slate-100' : ''}`}
              >
                <span className="flex items-center gap-2">
                  Customer Service
                  {openProblems > 0 && (
                    <span aria-label={`${openProblems} reported problem${openProblems === 1 ? '' : 's'} waiting`} className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                      {openProblems}
                    </span>
                  )}
                </span>
                <span className="text-slate-400">{showCustomerService ? '−' : '＋'}</span>
              </button>
              <div className="pt-3">
                <p className="px-3 text-base font-bold text-slate-900">Other Services</p>
                <div className="mt-2 space-y-1">
                  <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
                    <span>◔</span>
                    <span>Contact Preferences</span>
                  </button>
                  {/* Nothing for an administrator: this is what reaches them. */}
                  <ReportProblemButton />
                </div>
              </div>
            </div>

            {policyGroups.map((group) => (
              <div key={group.title} className="border-t border-slate-200 pt-5">
                <p className="mb-3 text-base font-bold text-slate-900">{group.title}</p>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <span className="text-slate-500">▣</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow-lg">
                  {initials}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Account profile</p>
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
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Name</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{user.name || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Email</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{user.email || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Phone</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{user.phone || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Location</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{location}</p>
              </div>
            </div>

            {user.role === 'courier' && (
              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Duty status</p>
                <CourierShiftToggle />
              </div>
            )}
          </div>

          {showCustomerService && (
            <div id="customer-service" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <CustomerServicePanel onCountChange={setOpenProblems} />
            </div>
          )}

          <div id="orders" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-8 flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center">
              <div className="space-y-3 px-6 py-10 text-slate-500">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">◌</div>
                <p className="text-xl font-medium text-slate-700">It is empty here :(</p>
                <p className="text-sm">Your {tabs.find((tab) => tab.id === activeTab)?.label.toLowerCase()} items will appear here.</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Following</h2>
            <span className="text-sm text-slate-500">0 item</span>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Recently Viewed</h3>
              <Link to="/products" className="text-sm font-semibold text-indigo-600">More →</Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="h-40 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.18),transparent_25%),linear-gradient(135deg,#f8fafc,#e2e8f0)]" />
              <div className="p-3">
                <p className="text-base font-semibold text-slate-800">Blue shirt</p>
                <p className="mt-1 text-sm text-slate-500">Recently viewed item</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
