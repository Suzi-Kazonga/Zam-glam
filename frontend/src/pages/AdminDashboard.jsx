import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SellerVerificationQueue from '../components/SellerVerificationQueue';
import UnclaimedParcels from '../components/UnclaimedParcels';
import ReportsQueue from '../components/ReportsQueue';
import { getAdminStats, getAdminUsers } from '../api/adminApi';
import { isLocalDemoSession } from '../utils/localSession';

const EMPTY_STATS = { subscribers: { customers: 0, sellers: 0, couriers: 0, admins: 0, total: 0 }, pending: { shops: 0, couriers: 0, total: 0 }, activity: { orders: 0, products: 0, stores: 0, reviews: 0 }, grace_days: 30 };

const sections = ['Overview', 'Sellers', 'Customers', 'Couriers', 'Verification', 'Reports', 'Deliveries'];

// The people pages are where accounts are actually managed; the sidebar just sends you there.
const SECTION_ROUTES = {
  Sellers: '/admin/users/sellers',
  Customers: '/admin/users/customers',
  Couriers: '/admin/users/couriers',
};

function StatusBadge({ account }) {
  if (account.deleted_at) return <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">Deleted</span>;
  if (account.account_status === 'suspended') return <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Suspended</span>;
  if (account.verification_status === 'pending') return <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Pending</span>;
  return <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  // Real figures and real accounts from the database. These used to come from a
  // hardcoded list in localStorage, so both the counts and the "accounts" were invented
  // and nothing the admin did here changed anything.
  const [live, setLive] = useState(EMPTY_STATS);
  const [recent, setRecent] = useState([]);
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isLocalDemoSession()) return undefined;
    const load = () => getAdminStats().then(setLive).catch(() => {});
    load();
    const poll = window.setInterval(load, 15000);
    return () => window.clearInterval(poll);
  }, []);

  useEffect(() => {
    if (isLocalDemoSession()) return;
    Promise.all([getAdminUsers('sellers'), getAdminUsers('customers')])
      .then(([sellers, customers]) => {
        const merged = [
          ...sellers.map((s) => ({ ...s, role: 'seller', detail: [s.store_name, s.location].filter(Boolean).join(' · ') })),
          ...customers.map((c) => ({ ...c, role: 'customer', detail: c.address || c.location || '' })),
        ];
        merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setRecent(merged);
      })
      .catch(() => {});
  }, []);

  const visible = useMemo(() => {
    const needle = query.toLowerCase();
    return recent
      .filter((a) => `${a.name || ''} ${a.email || ''} ${a.phone || ''} ${a.detail || ''}`.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [recent, query]);

  const openSection = (section) => {
    if (SECTION_ROUTES[section]) navigate(SECTION_ROUTES[section]);
    else setActive(section);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={sections} active={active} onSelect={openSection} role="admin" />
      <div className="min-w-0 flex-1">
        <Topbar onSearch={setQuery} />
        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-800">Admin console</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Manage marketplace accounts</h1>
            <p className="mt-1 text-slate-500">Review, edit, suspend or remove shops, customers and couriers from one place.</p>
          </div>

          {active === 'Overview' && (
            <>
              {/* Subscriber figures, straight from the database. Each opens the accounts behind it. */}
              <div>
                <h2 className="text-xl font-bold text-slate-900">Subscribers</h2>
                <p className="text-sm text-slate-500">{live.subscribers.total} registered accounts. Click a figure to see who they are.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link to="/admin/users/sellers" className="block"><DashboardCard title="Shops" value={live.subscribers.sellers} detail="Registered vendors →" /></Link>
                <Link to="/admin/users/customers" className="block"><DashboardCard title="Customers" value={live.subscribers.customers} detail="Shopper accounts →" /></Link>
                <Link to="/admin/users/couriers" className="block"><DashboardCard title="Couriers" value={live.subscribers.couriers} detail="Delivery riders →" /></Link>
                <button type="button" onClick={() => setActive('Verification')} className="text-left"><DashboardCard title="Awaiting approval" value={live.pending.total} detail={live.pending.shops + ' shop(s) · ' + live.pending.couriers + ' courier(s)'} /></button>
              </div>

              <div><h2 className="text-xl font-bold text-slate-900">Activity</h2></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardCard title="Orders" value={live.activity.orders} detail="Placed all time" />
                <DashboardCard title="Products" value={live.activity.products} detail="Listed across shops" />
                <DashboardCard title="Stores" value={live.activity.stores} detail="Storefronts open" />
                <DashboardCard title="Reviews" value={live.activity.reviews} detail="Customer ratings" />
              </div>

              <DashboardCard title="Newest accounts" className="overflow-hidden">
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">The latest shops and customers to sign up. Open a group to edit, suspend or remove an account.</p>
                  <div className="flex gap-2">
                    <Link to="/admin/users/sellers" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Manage shops</Link>
                    <Link to="/admin/users/customers" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Manage customers</Link>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-slate-100 text-slate-400">
                      <tr>
                        <th className="py-3">Name</th>
                        <th>Contact</th>
                        <th>Shop / address</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th className="text-right">Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.length ? visible.map((account) => (
                        <tr key={`${account.role}-${account.id}`} className={`border-b border-slate-50 last:border-0 ${account.deleted_at ? 'bg-slate-50 text-slate-400' : ''}`}>
                          <td className="py-4">
                            <p className={`font-semibold ${account.deleted_at ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{account.name || '—'}</p>
                            <p className="text-xs capitalize text-slate-400">{account.role}</p>
                          </td>
                          <td>
                            <p>{account.email}</p>
                            <p className="text-xs text-slate-400">{account.phone || 'no phone'}</p>
                          </td>
                          <td className="text-slate-500">{account.detail || '—'}</td>
                          <td><StatusBadge account={account} /></td>
                          <td className="text-slate-500">{account.created_at ? new Date(account.created_at).toLocaleDateString() : '—'}</td>
                          <td className="text-right">
                            <Link to={`/admin/users/${account.role === 'seller' ? 'sellers' : 'customers'}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                              Open
                            </Link>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="py-10 text-center text-slate-500">No accounts match your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            </>
          )}

          {active === 'Verification' && (
            <DashboardCard title="Vendor verification">
              <p className="mt-1 text-sm text-slate-500">Check each shop&apos;s paperwork before approving it. Verified shops carry a badge shoppers can see.</p>
              <div className="mt-4"><SellerVerificationQueue /></div>
            </DashboardCard>
          )}

          {active === 'Reports' && (
            <DashboardCard title="Complaints and suspensions">
              <p className="mt-1 text-sm text-slate-500">Parties reported by customers, shops or couriers. Three reports against the same party flag them here.</p>
              <div className="mt-4"><ReportsQueue /></div>
            </DashboardCard>
          )}

          {active === 'Deliveries' && (
            <DashboardCard title="Parcels waiting for a courier">
              <p className="mt-1 text-sm text-slate-500">Released by a shop but not yet collected. Anything unclaimed for an hour is assigned to an on-duty courier automatically.</p>
              <div className="mt-4"><UnclaimedParcels /></div>
            </DashboardCard>
          )}
        </main>
      </div>
    </div>
  );
}
