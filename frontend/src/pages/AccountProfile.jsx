import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOrders } from '../api/orderApi';
import { isLocalDemoSession } from '../utils/localSession';

export default function AccountProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

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
          <button type="button" onClick={() => { logout(); navigate('/'); }} className="rounded-lg border border-rose-200 px-4 py-2 font-semibold text-rose-600 transition hover:bg-rose-50">Log out</button>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Orders</h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">Order #{order.id}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status || 'pending'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(order.createdAt || order.placed_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {order.shipments?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-slate-700">
                          {order.shipments.filter((s) => s.status === 'delivered').length} of {order.shipments.length} package{order.shipments.length > 1 ? 's' : ''} delivered
                          {order.shipments.length > 1 && <span className="font-normal text-slate-500"> · from {order.shipments.length} shops</span>}
                        </p>
                        <ul className="mt-1 space-y-1">
                          {order.shipments.map((shipment, index) => (
                            <li key={shipment.id} className="text-xs text-slate-500">
                              Package {index + 1}/{order.shipments.length} · {shipment.storeName} —
                              <span className="font-semibold capitalize text-slate-700"> {shipment.status}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="mt-2 text-slate-600">
                      Deliver to: <span className="font-semibold">{order.address}</span>
                    </p>
                    {order.location && (
                      <p className="text-slate-600">
                        Location: <span className="font-semibold">{order.location}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">K{Number(order.total).toFixed(2)}</p>
                    <Link 
                      to={`/orders/${order.id}`} 
                      className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-slate-500 mb-4">No orders yet</p>
          <Link to="/products" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
            Start shopping
          </Link>
        </div>
      )}
    </main>
  );
}
