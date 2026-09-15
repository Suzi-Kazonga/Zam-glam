// One page per group of accounts — customers, shops, couriers — where an administrator
// edits, suspends, deletes and restores them.

import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DashboardCard from '../components/DashboardCard';
import { useAuth } from '../context/AuthContext';
import {
  deleteAdminAccount,
  editAdminAccount,
  getAdminStats,
  getAdminUsers,
  restoreAdminAccount,
  reviewCourierApproval,
} from '../api/adminApi';
import { setAccountStatus } from '../api/reportApi';
import { isLocalDemoSession } from '../utils/localSession';
import { formatZmwPrice } from '../utils/currency';

// One page for each group of subscribers, reached from the header or by clicking a
// figure on the admin dashboard. Every row is a real account from the database, and
// every action here writes to it.
const GROUPS = {
  customers: {
    title: 'Customers',
    blurb: 'Everyone shopping on Zamglam.',
    columns: ['Name', 'Contact', 'Location', 'Orders', 'Spent', 'Joined'],
    fields: [
      { key: 'name', label: 'Full name' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' },
      { key: 'location', label: 'Town' },
    ],
  },
  sellers: {
    title: 'Shops',
    blurb: 'Registered vendors and the state of their verification.',
    columns: ['Shop', 'Contact', 'Verification', 'Products', 'Rating', 'Joined'],
    // The list query returns shop_name as `name`; the update endpoint wants shop_name.
    fields: [
      { key: 'name', label: 'Shop name', saveAs: 'shop_name' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone' },
    ],
  },
  couriers: {
    title: 'Couriers',
    blurb: 'Delivery riders, their approval state and duty status.',
    columns: ['Name', 'Contact', 'Approval', 'Duty', 'Parcels', 'Joined'],
    fields: [
      { key: 'name', label: 'Full name' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone' },
    ],
  },
};

// The API addresses one account at a time in the singular.
const SINGULAR = { customers: 'customer', sellers: 'seller', couriers: 'courier' };

const sections = ['Overview', 'Sellers', 'Customers', 'Verification', 'Deliveries'];

const badge = (text, tone) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{text}</span>
);

const dateOf = (value) => (value ? new Date(value).toLocaleDateString() : '—');

// A deleted account is kept, greyed out, until its grace period runs out. Show the admin
// how long they still have to change their mind.
const daysLeft = (deletedAt, graceDays) => {
  const expiresAt = new Date(deletedAt).getTime() + graceDays * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
};

function EditModal({ group, account, onClose, onSave }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(group.fields.map((field) => [field.key, account[field.key] || ''])));
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    // Send the column names the backend whitelists, not the display keys.
    const payload = {};
    group.fields.forEach((field) => { payload[field.saveAs || field.key] = form[field.key]; });
    await onSave(payload);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">Edit account</h2>
        <p className="mt-1 text-sm text-slate-500">These details are saved to the account itself.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {group.fields.map((field) => (
            <label key={field.key} className="text-sm font-medium text-slate-600">
              {field.label}
              <input
                type={field.type || 'text'}
                value={form[field.key]}
                onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
              />
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDelete({ account, graceDays, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">Delete this account?</h2>
        <p className="mt-2 text-sm text-slate-500">
          <strong>{account.name || account.email}</strong> will no longer be able to sign in, and a shop&apos;s
          products leave the catalogue. The account stays here, greyed out, for {graceDays} days so you can
          restore it. After that it is removed for good.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700">Delete account</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { role } = useParams();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [graceDays, setGraceDays] = useState(30);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const group = GROUPS[role];
  const singular = SINGULAR[role];

  const load = () => {
    if (!group || isLocalDemoSession()) return;
    getAdminUsers(role)
      .then(setRows)
      .catch((error) => setMessage(error?.error || 'Could not load these accounts.'));
  };

  useEffect(load, [role]);

  // Keep the grace period this page quotes in step with the server's setting.
  useEffect(() => {
    if (isLocalDemoSession()) return;
    getAdminStats()
      .then((stats) => { if (stats?.grace_days) setGraceDays(stats.grace_days); })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => `${r.name || ''} ${r.email || ''} ${r.phone || ''}`.toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  );

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;
  if (!group) return <Navigate to="/admin/dashboard" replace />;

  // Every action below writes to the database and then reloads the list, so what the
  // page shows is what the account actually is.
  const run = async (account, work, success) => {
    setBusyId(account.id);
    setMessage('');
    try {
      await work();
      setMessage(success);
      load();
      return true;
    } catch (error) {
      setMessage(error?.error || 'That did not work.');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const decideCourier = (courier, status) =>
    run(courier, () => reviewCourierApproval(courier.id, status), `${courier.name} ${status}.`);

  const toggleSuspension = (account) => {
    const next = account.account_status === 'suspended' ? 'active' : 'suspended';
    return run(
      account,
      () => setAccountStatus(singular, account.id, next, 'Suspended by an administrator'),
      `${account.name || account.email} is now ${next}.`,
    );
  };

  const remove = async () => {
    const account = confirming;
    setConfirming(null);
    await run(
      account,
      () => deleteAdminAccount(singular, account.id),
      `${account.name || account.email} deleted. You have ${graceDays} days to restore it.`,
    );
  };

  const restore = (account) =>
    run(account, () => restoreAdminAccount(singular, account.id), `${account.name || account.email} restored.`);

  const saveEdit = async (payload) => {
    const account = editing;
    const saved = await run(account, () => editAdminAccount(singular, account.id, payload), 'Account updated.');
    if (saved) setEditing(null);
  };

  const deletedCount = rows.filter((r) => r.deleted_at).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={sections} active={group.title === 'Shops' ? 'Sellers' : group.title} onSelect={() => {}} role="admin" />
      <div className="min-w-0 flex-1">
        <Topbar onSearch={setQuery} />
        <main className="mx-auto max-w-7xl space-y-6 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">
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
            {role === 'customers' && <DashboardCard title="Orders placed" value={rows.reduce((total, r) => total + Number(r.order_count || 0), 0)} detail="Across all customers" />}
          </div>

          {deletedCount > 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {deletedCount} deleted account{deletedCount === 1 ? '' : 's'} still inside the {graceDays}-day restore
              window. They cannot sign in, and they are removed for good once it runs out.
            </p>
          )}

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-slate-100 text-slate-400">
                  <tr>
                    {group.columns.map((column) => <th key={column} className="py-3">{column}</th>)}
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length ? filtered.map((r) => (
                    <tr key={r.id} className={`border-b border-slate-50 last:border-0 ${r.deleted_at ? 'bg-slate-50 text-slate-400' : ''}`}>
                      <td className={`py-3 font-semibold ${r.deleted_at ? 'text-slate-400' : 'text-slate-900'}`}>
                        <span className={r.deleted_at ? 'line-through' : ''}>{r.name || '—'}</span>
                        {r.deleted_at && (
                          <span className="block text-xs font-semibold uppercase tracking-wide text-rose-500">
                            Deleted · {daysLeft(r.deleted_at, graceDays)} day{daysLeft(r.deleted_at, graceDays) === 1 ? '' : 's'} to restore
                          </span>
                        )}
                        {!r.deleted_at && r.account_status === 'suspended' && (
                          <span className="block text-xs font-semibold uppercase tracking-wide text-rose-600">Suspended</span>
                        )}
                      </td>
                      <td className={r.deleted_at ? '' : 'text-slate-600'}>
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

                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {r.deleted_at ? (
                            <button type="button" disabled={busyId === r.id} onClick={() => restore(r)} className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                              Restore
                            </button>
                          ) : (
                            <>
                              {role === 'couriers' && r.approval_status !== 'approved' && (
                                <button type="button" disabled={busyId === r.id} onClick={() => decideCourier(r, 'approved')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-slate-50 disabled:opacity-50">Approve</button>
                              )}
                              {role === 'couriers' && r.approval_status !== 'rejected' && (
                                <button type="button" disabled={busyId === r.id} onClick={() => decideCourier(r, 'rejected')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-slate-50 disabled:opacity-50">Reject</button>
                              )}
                              <button type="button" disabled={busyId === r.id} onClick={() => setEditing(r)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">Edit</button>
                              <button type="button" disabled={busyId === r.id} onClick={() => toggleSuspension(r)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">
                                {r.account_status === 'suspended' ? 'Reinstate' : 'Suspend'}
                              </button>
                              <button type="button" disabled={busyId === r.id} onClick={() => setConfirming(r)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">Delete</button>
                            </>
                          )}
                        </div>
                      </td>
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

      {editing && <EditModal group={group} account={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}
      {confirming && <ConfirmDelete account={confirming} graceDays={graceDays} onClose={() => setConfirming(null)} onConfirm={remove} />}
    </div>
  );
}
