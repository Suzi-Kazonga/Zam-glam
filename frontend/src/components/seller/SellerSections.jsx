import { Link } from 'react-router-dom';
import DashboardCard from '../DashboardCard';
import StarRating from '../StarRating';

function statusLabel(status) {
  if (status === 'delivered') return 'Delivered';
  if (status === 'picked_up' || status === 'in_transit') return 'In transit';
  if (status === 'processing') return 'Packing';
  if (status === 'shipped') return 'Ready for courier';
  if (status === 'pickup_requested') return 'Courier at shop';
  return 'Pending';
}

function statusStyle(status) {
  if (status === 'delivered') return 'bg-emerald-50 text-emerald-800';
  if (status === 'picked_up' || status === 'in_transit') return 'bg-sky-50 text-sky-800';
  if (status === 'processing' || status === 'shipped' || status === 'pickup_requested') return 'bg-amber-50 text-amber-800';
  return 'bg-amber-50 text-amber-800';
}

function BarList({ rows, label, value, format = (amount) => amount }) {
  const max = Math.max(1, ...rows.map((row) => Number(row[value]) || 0));
  if (!rows.length) return <p className="text-sm text-slate-500">Sales activity will appear here.</p>;
  return <div className="space-y-4">
    {rows.map((row) => {
      const amount = Number(row[value]) || 0;
      return <div key={row[label]}>
        <div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-slate-600">{row[label]}</span><span className="shrink-0 font-semibold text-slate-900">{format(amount)}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.max(4, amount / max * 100)}%` }} /></div>
      </div>;
    })}
  </div>;
}

export function OrderTracker({ orders, onAdvance, busyId }) {
  return <DashboardCard title="Shop orders" detail="Start packing each new parcel, then release it to the courier pool.">
    <div className="mt-3 divide-y divide-slate-100">
      {orders.map((order) => <article key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">Order #{order.id}</p><p className="mt-1 text-sm text-slate-600">{(order.items || []).map((item) => `${item.name} ×${item.quantity}`).join(', ')}</p><p className="mt-1 text-sm text-slate-500">Your items · K{Number(order.sellerTotal || 0).toFixed(2)}</p></div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${statusStyle(order.fulfillmentStatus || order.status)}`}>{statusLabel(order.fulfillmentStatus || order.status)}</span>
          {order.fulfillmentStatus === 'placed' && <button type="button" disabled={busyId === order.shipmentId} onClick={() => onAdvance(order, 'processing')} className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">{busyId === order.shipmentId ? 'Saving...' : 'Start packing'}</button>}
          {order.fulfillmentStatus === 'processing' && <button type="button" disabled={busyId === order.shipmentId} onClick={() => onAdvance(order, 'shipped')} className="rounded-md bg-sky-800 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-900 disabled:opacity-50">{busyId === order.shipmentId ? 'Saving...' : 'Release to courier'}</button>}
        </div>
      </article>)}
      {!orders.length && <p className="py-6 text-sm text-slate-500">New orders will appear here.</p>}
    </div>
  </DashboardCard>;
}

export function AnalyticsViewer({ revenue, orders, inTransit, delivered, revenueByDay, topProducts, reviews, unansweredReviews, score }) {
  const engagementByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    return { date: date.toLocaleDateString(), day: date.toLocaleDateString(undefined, { weekday: 'short' }), amount: 0 };
  });
  reviews.forEach((review) => {
    const row = engagementByDay.find((day) => day.date === new Date(review.created_at).toLocaleDateString());
    if (row) row.amount += 1;
  });

  return <section className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><DashboardCard title="Revenue" value={`K${revenue.toFixed(2)}`} detail="Your products only" /><DashboardCard title="Orders" value={orders.length} detail="Shop orders" /><DashboardCard title="In transit" value={inTransit} detail="Delivery progress" /><DashboardCard title="Delivered" value={delivered} detail="Completed orders" /></div>
    <div className="grid gap-4 lg:grid-cols-2"><DashboardCard title="Revenue · last 7 days"><div className="mt-5"><BarList rows={revenueByDay} label="day" value="amount" format={(amount) => `K${amount.toFixed(2)}`} /></div></DashboardCard><DashboardCard title="Top-selling items"><div className="mt-5"><BarList rows={topProducts} label="name" value="units" format={(amount) => `${amount} sold`} /></div></DashboardCard><DashboardCard title="Engagement · review activity"><div className="mt-5"><BarList rows={engagementByDay} label="day" value="amount" format={(amount) => `${amount} reviews`} /></div></DashboardCard><DashboardCard title="Customer ratings"><div className="mt-4 flex flex-wrap items-center gap-3"><StarRating value={Math.round(score.average)} readOnly /><span className="text-sm text-slate-500">{score.count ? `${score.average} average · ${score.count} ratings` : 'No ratings yet'}</span></div><p className="mt-4 text-sm text-slate-600">{reviews.length - unansweredReviews.length} of {reviews.length} reviews have a seller reply.</p></DashboardCard></div>
  </section>;
}

export function NotificationCenter({ orders, lowStock, unansweredReviews, onNavigate }) {
  const newOrders = orders.filter((order) => order.status === 'pending');
  const notificationCount = newOrders.length + lowStock.length + unansweredReviews.length;
  return <DashboardCard title={`Shop notifications${notificationCount ? ` · ${notificationCount} new` : ''}`} detail="Orders, inventory, and customer feedback.">
    <div className="mt-3 divide-y divide-slate-100">
      {newOrders.map((order) => <button key={order.id} type="button" onClick={() => onNavigate('Orders')} className="block w-full py-3 text-left"><p className="font-semibold">New order #{order.id}</p><p className="text-sm text-slate-500">{(order.items || []).map((item) => item.name).join(', ')}</p></button>)}
      {lowStock.map((product) => <button key={product.id} type="button" onClick={() => onNavigate('Products')} className="block w-full py-3 text-left"><p className="font-semibold text-amber-800">Low stock: {product.name}</p><p className="text-sm text-slate-500">{product.stock} units remaining</p></button>)}
      {unansweredReviews.map((review) => <button key={review.id} type="button" onClick={() => onNavigate('Reviews')} className="block w-full py-3 text-left"><p className="font-semibold">Customer feedback awaiting reply</p><p className="text-sm text-slate-500">{review.comment || 'A customer left a product rating.'}</p></button>)}
      {!notificationCount && <p className="py-5 text-sm text-slate-500">You’re all caught up.</p>}
    </div>
  </DashboardCard>;
}

export function StoreProfileManager({ store, profile, setProfile, saving, onSubmit, user }) {
  return <DashboardCard title="Store profile" detail="Details shown to shoppers on your storefront.">
    <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Store name<input required value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Logo image URL<input type="url" value={profile.logo_url} onChange={(event) => setProfile((current) => ({ ...current, logo_url: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Contact email<input type="email" value={profile.contact_email} onChange={(event) => setProfile((current) => ({ ...current, contact_email: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Contact phone<input type="tel" value={profile.contact_phone} onChange={(event) => setProfile((current) => ({ ...current, contact_phone: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">Description<textarea rows={4} value={profile.description} onChange={(event) => setProfile((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Store location<input value={profile.location} onChange={(event) => setProfile((current) => ({ ...current, location: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
      <div className="flex items-end"><button type="submit" disabled={saving || !store?.id} className="rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">{saving ? 'Saving...' : 'Save profile'}</button></div>
    </form>
    <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600"><p className="font-semibold text-slate-800">Store contact on your listing</p><p className="mt-1">{profile.contact_email || 'No contact email'} · {profile.contact_phone || 'No contact phone'}</p>{user && <Link to="/account" className="mt-2 inline-block font-semibold text-emerald-800">Account details</Link>}{profile.logo_url && <img src={profile.logo_url} alt="Store logo preview" className="mt-4 h-16 max-w-40 object-contain" />}</div>
  </DashboardCard>;
}