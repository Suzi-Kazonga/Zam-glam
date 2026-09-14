import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SellerVerificationQueue from '../components/SellerVerificationQueue';
import UnclaimedParcels from '../components/UnclaimedParcels';
import { getAdminStats } from '../api/adminApi';
import { isLocalDemoSession } from '../utils/localSession';
import { createAccount, deleteAccount, getAccountStats, getAccounts, updateAccount } from '../utils/accountStore';

const EMPTY_STATS = { subscribers: { customers: 0, sellers: 0, couriers: 0, admins: 0, total: 0 }, pending: { shops: 0, couriers: 0, total: 0 }, activity: { orders: 0, products: 0, stores: 0, reviews: 0 } };

const sections = ['Overview', 'Sellers', 'Customers', 'Verification', 'Deliveries'];
const emptyForm = {
  name: '',
  email: '',
  phone: '',
  shopName: '',
  location: '',
  address: '',
  status: 'active',
};

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    suspended: 'bg-rose-50 text-rose-700',
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

function AccountModal({ role, account, onClose, onSave }) {
  const [form, setForm] = useState(account ? {
    name: account.name || '',
    email: account.email || '',
    phone: account.phone || '',
    shopName: account.shopName || '',
    location: account.location || '',
    address: account.address || '',
    status: account.status || 'active',
  } : emptyForm);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ ...form, role });
        }}
      >
        <h2 className="text-xl font-bold text-slate-900">{account ? 'Edit' : 'Add'} {role} account</h2>
        <p className="mt-1 text-sm text-slate-500">Changes are saved in this browser only.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-600">Full name
            <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400" />
          </label>
          <label className="text-sm font-medium text-slate-600">Email
            <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400" />
          </label>
          <label className="text-sm font-medium text-slate-600">Phone
            <input required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400" />
          </label>
          <label className="text-sm font-medium text-slate-600">Status
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400">
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          {role === 'seller' ? (
            <>
              <label className="text-sm font-medium text-slate-600">Shop name
                <input required value={form.shopName} onChange={(event) => updateField('shopName', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400" />
              </label>
              <label className="text-sm font-medium text-slate-600">Location
                <input required value={form.location} onChange={(event) => updateField('location', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400" />
              </label>
            </>
          ) : (
            <label className="text-sm font-medium text-slate-600 sm:col-span-2">Address
              <input required value={form.address} onChange={(event) => updateField('address', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400" />
            </label>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900">Save account</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  // Real figures from the database; the old ones came from a hardcoded list in
  // localStorage, so they were invented.
  const [live, setLive] = useState(EMPTY_STATS);

  useEffect(() => {
    if (isLocalDemoSession()) return undefined;
    const load = () => getAdminStats().then(setLive).catch(() => {});
    load();
    const poll = window.setInterval(load, 15000);
    return () => window.clearInterval(poll);
  }, []);

  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accounts, setAccounts] = useState(() => getAccounts());
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notice, setNotice] = useState('');

  const stats = getAccountStats(accounts);
  const roleForSection = active === 'Customers' ? 'customer' : 'seller';

  const visibleAccounts = useMemo(() => {
    const role = active === 'Customers' ? 'customer' : 'seller';
    return accounts.filter((account) => {
      if (active !== 'Overview' && account.role !== role) return false;
      if (statusFilter !== 'all' && account.status !== statusFilter) return false;
      const haystack = `${account.name} ${account.email} ${account.shopName || ''} ${account.address || ''} ${account.phone || ''}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [accounts, active, query, statusFilter]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  const saveAccount = (payload) => {
    if (modal?.account) {
      setAccounts(updateAccount(modal.account.id, payload));
      showNotice('Account updated.');
    } else {
      setAccounts(createAccount(payload));
      showNotice('Account created.');
    }
    setModal(null);
  };

  const toggleStatus = (account) => {
    const nextStatus = account.status === 'suspended' ? 'active' : 'suspended';
    setAccounts(updateAccount(account.id, { status: nextStatus }));
    showNotice(`${account.name} is now ${nextStatus}.`);
  };

  const removeAccount = () => {
    setAccounts(deleteAccount(confirmDelete.id));
    showNotice(`${confirmDelete.name} was removed.`);
    setConfirmDelete(null);
  };

  const tableAccounts = active === 'Overview' ? visibleAccounts.slice(0, 8) : visibleAccounts;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={sections} active={active} onSelect={(section) => { setActive(section); setStatusFilter('all'); }} role="admin" />
      <div className="min-w-0 flex-1">
        <Topbar onSearch={setQuery} />
        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-800">Admin console</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Manage marketplace accounts</h1>
            <p className="mt-1 text-slate-500">Review, edit, suspend, or remove seller and customer accounts from one place.</p>
          </div>

          {notice && <p className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-900">{notice}</p>}

          {(active === 'Overview') && (
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
            </>
          )}

          {active === 'Verification' && (
            <DashboardCard title="Vendor verification">
              <p className="mt-1 text-sm text-slate-500">Check each shop's paperwork before approving it. Verified shops carry a badge shoppers can see.</p>
              <div className="mt-4"><SellerVerificationQueue /></div>
            </DashboardCard>
          )}

          {active === 'Deliveries' && (
            <DashboardCard title="Parcels waiting for a courier">
              <p className="mt-1 text-sm text-slate-500">Released by a shop but not yet collected. Anything unclaimed for an hour is assigned to an on-duty courier automatically.</p>
              <div className="mt-4"><UnclaimedParcels /></div>
            </DashboardCard>
          )}

          {active !== 'Verification' && active !== 'Deliveries' && (
          <DashboardCard title={active === 'Overview' ? 'Recent accounts' : `${active} accounts`} className="overflow-hidden">
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {['all', 'active', 'pending', 'suspended'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${statusFilter === status ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              {active !== 'Overview' && (
                <button type="button" onClick={() => setModal({ role: roleForSection })} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
                  Add {roleForSection}
                </button>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-100 text-slate-400">
                  <tr>
                    <th className="py-3">Name</th>
                    <th>Contact</th>
                    <th>{active === 'Customers' ? 'Address' : 'Shop'}</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableAccounts.length ? tableAccounts.map((account) => (
                    <tr key={account.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-4">
                        <p className="font-semibold text-slate-900">{account.name}</p>
                        <p className="text-xs capitalize text-slate-400">{account.role}</p>
                      </td>
                      <td>
                        <p>{account.email}</p>
                        <p className="text-xs text-slate-400">{account.phone}</p>
                      </td>
                      <td>{account.role === 'seller' ? `${account.shopName} · ${account.location}` : account.address}</td>
                      <td><StatusBadge status={account.status} /></td>
                      <td className="text-slate-500">{account.joinedAt}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setModal({ role: account.role, account })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Edit</button>
                          <button type="button" onClick={() => toggleStatus(account)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                            {account.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </button>
                          <button type="button" onClick={() => setConfirmDelete(account)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-500">No accounts match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
          )}
        </main>
      </div>

      {modal && <AccountModal role={modal.role} account={modal.account} onClose={() => setModal(null)} onSave={saveAccount} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Delete this account?</h2>
            <p className="mt-2 text-sm text-slate-500">This removes <strong>{confirmDelete.name}</strong> from the admin list in this browser. It cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={removeAccount} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700">Delete account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
