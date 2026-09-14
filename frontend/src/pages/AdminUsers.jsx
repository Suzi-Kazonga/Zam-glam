import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DashboardCard from '../components/DashboardCard';
import { useAuth } from '../context/AuthContext';
import { getAdminUsers, reviewCourierApproval } from '../api/adminApi';
import { isLocalDemoSession } from '../utils/localSession';
import { formatZmwPrice } from '../utils/currency';

// One page for each group of subscribers, reached from the header or by clicking a
// figure on the admin dashboard. Every row is a real account from the database.
const GROUPS = {
  customers: {
    title: 'Customers',
    blurb: 'Everyone shopping on Zamglam.',
    columns: ['Name', 'Contact', 'Location', 'Orders', 'Spent', 'Joined'],
  },
  sellers: {
    title: 'Shops',
    blurb: 'Registered vendors and the state of their verification.',
    columns: ['Shop', 'Contact', 'Verification', 'Products', 'Rating', 'Joined'],
  },
  couriers: {
    title: 'Couriers',
    blurb: 'Delivery riders, their approval state and duty status.',
    columns: ['Name', 'Contact', 'Approval', 'Duty', 'Parcels', 'Joined'],
  },
};

const sections = ['Overview', 'Sellers', 'Customers', 'Verification', 'Deliveries'];

const badge = (text, tone) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{text}</span>
);

const dateOf = (value) => (value ? new Date(value).toLocaleDateString() : '—');

export default function AdminUsers() {
  const { role } = useParams();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

  const group = GROUPS[role];

  const load = () => {
    if (!group || isLocalDemoSession()) return;
    getAdminUsers(role)
      .then(setRows)
      .catch((error) => setMessage(error?.error || 'Could not load these accounts.'));
  };

  useEffect(load, [role]);

  const filtered = useMemo(
    () => rows.filter((r) => `${r.name || ''} ${r.email || ''} ${r.phone || ''}`.toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  );

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;
  if (!group) return <Navigate to="/admin/dashboard" replace />;

  const decideCourier = async (courier, status) => {
    setBusyId(courier.id);
    setMessage('');
    try {
      await reviewCourierApproval(courier.id, status);
      setMessage(`${courier.name} ${status}.`);
      load();
    } catch (error) {
      setMessage(error?.error || 'Could not update that courier.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={sections} active={group.title === 'Shops' ? 'Sellers' : group.title} onSelect={() => {}} role="admin" />
      <div className="min-w-0 flex-1">
        <Topbar onSearch={setQuery} />
        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-800">Admin</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{group.title}</h1>
              <p className="mt-1 text-slate-500">{group.blurb}</p>
            </div>
            <Link to="/admin/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:border-slate-900">
              ← Dashboard
            </Link>
          </div>

          {message && <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p>}

          <div className="grid gap-4 sm:grid-cols-3">
            <DashboardCard title={`Total ${group.title.toLowerCase()}`} value={rows.length} detail="Registered accounts" />
            {role === 'sellers' && <DashboardCard title="Verified" value={rows.filter((r) => r.verification_status === 'verified').length} detail="Checked shops" />}
            {role === 'sellers' && <DashboardCard title="Awaiting review" value={rows.filter((r) => r.verification_status === 'pending').length} detail="Need a decision" />}
            {role === 'couriers' && <DashboardCard title="Approved" value={rows.filter((r) => r.approval_status === 'approved').length} detail="Can take parcels" />}
            {role === 'couriers' && <DashboardCard title="On duty now" value={rows.filter((r) => Number(r.on_shift) === 1).length} detail="Available for pickups" />}
            {role === 'customers' && <DashboardCard title="Have ordered" value={rows.filter((r) => Number(r.order_count) > 0).length} detail="Placed at least one order" />}
            {role === 'customers' && <DashboardCard title="Orders placed" value={rows.reduce((t, r) => t + Number(r.order_count || 0), 0)} detail="Across all customers" />}
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-100 text-slate-400">
                  <tr>{group.columns.map((c) => <th key={c} className="py-3">{c}</th>)}{role === 'couriers' && <th />}</tr>
                </thead>
                <tbody>
                  {filtered.length ? filtered.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 font-semibold text-slate-900">{r.name || '—'}</td>
                      <td className="text-slate-600">
                        {r.email || '—'}
                        <span className="block text-xs text-slate-400">{r.phone || 'no phone'}</span>
                      </td>

                      {role === 'customers' && <td className="text-slate-500">{r.location || r.address || '—'}</td>}
                      {role === 'customers' && <td>{r.order_count}</td>}
                      {role === 'customers' && <td>{formatZmwPrice(r.total_spent || 0)}</td>}

                      {role === 'sellers' && (
                        <td>
                          {r.verification_status === 'verified'
                            ? badge('Verified', 'bg-emerald-100 text-emerald-800')
                            : r.verification_status === 'rejected'
                              ? badge('Rejected', 'bg-rose-100 text-rose-800')
                              : badge('Pending', 'bg-amber-100 text-amber-800')}
                          <span className="ml-2 text-xs text-slate-400">{r.document_count} doc{Number(r.document_count) === 1 ? '' : 's'}</span>
                        </td>
                      )}
                      {role === 'sellers' && <td>{r.product_count}</td>}
                      {role === 'sellers' && <td>{Number(r.rating) > 0 ? `★ ${r.rating}` : '—'}</td>}

                      {role === 'couriers' && (
                        <td>
                          {r.approval_status === 'approved'
                            ? badge('Approved', 'bg-emerald-100 text-emerald-800')
                            : r.approval_status === 'rejected'
                              ? badge('Rejected', 'bg-rose-100 text-rose-800')
                              : badge('Pending', 'bg-amber-100 text-amber-800')}
                        </td>
                      )}
                      {role === 'couriers' && <td>{Number(r.on_shift) === 1 ? badge('On duty', 'bg-emerald-50 text-emerald-700') : <span className="text-slate-400">Off duty</span>}</td>}
                      {role === 'couriers' && <td>{r.parcels_delivered}/{r.parcels_taken}</td>}

                      <td className="text-slate-500">{dateOf(r.created_at)}</td>

                      {role === 'couriers' && (
                        <td className="text-right">
                          {r.approval_status !== 'approved' && (
                            <button type="button" disabled={busyId === r.id} onClick={() => decideCourier(r, 'approved')} className="mr-2 font-semibold text-emerald-700 disabled:opacity-50">Approve</button>
                          )}
                          {r.approval_status !== 'rejected' && (
                            <button type="button" disabled={busyId === r.id} onClick={() => decideCourier(r, 'rejected')} className="font-semibold text-rose-600 disabled:opacity-50">Reject</button>
                          )}
                        </td>
                      )}
                    </tr>
                  )) : (
                    <tr><td colSpan={group.columns.length + 1} className="py-8 text-center text-slate-500">No accounts match.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
