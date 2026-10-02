import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import ProductForm from '../components/ProductForm';
import StoreMessages from '../components/StoreMessages';
import Sidebar from '../components/Sidebar';
import StarRating from '../components/StarRating';
import PromotionManager from '../components/seller/PromotionManager';
import { AnalyticsViewer, NotificationCenter, OrderTracker, StoreProfileManager } from '../components/seller/SellerSections';
import SuspendedNotice from '../components/SuspendedNotice';
import Topbar from '../components/Topbar';
import VerificationPanel from '../components/VerificationPanel';
import { useProductEditor } from '../hooks/useProductEditor';
import { getMyOrders, updateShipmentStatus } from '../api/orderApi';
import { deleteProduct, getSellerProducts } from '../api/productApi';
import { getMyReviews, replyToReview } from '../api/reviewApi';
import { getMyStore, updateStore } from '../api/storeApi';
import { useAuth } from '../context/AuthContext';
import { isLocalDemoSession } from '../utils/localSession';

const sections = ['Overview', 'Products', 'Orders', 'Messages', 'Analytics', 'Promotions', 'Store profile', 'Notifications', 'Reviews', 'Verification'];

function deliveryLabel(status) {
  if (status === 'delivered') return 'Delivered';
  if (status === 'in_transit') return 'In transit';
  return 'Pending';
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [score, setScore] = useState({ average: 0, count: 0 });
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [store, setStore] = useState(null);
  const [storefront, setStorefront] = useState('/products');
  const [profile, setProfile] = useState({ name: '', description: '', logo_url: '', contact_email: '', contact_phone: '', location: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const sellerName = user?.shop_name || user?.name || 'My Shop';

  useEffect(() => {
    const requested = new URLSearchParams(location.search).get('section');
    if (sections.includes(requested)) setActive(requested);
  }, [location.search]);

  const loadProducts = () => getSellerProducts()
    .then((rows) => setProducts(Array.isArray(rows) ? rows : []))
    .catch(() => setMessage('Could not load your products.'));

  const loadOrders = () => {
    if (isLocalDemoSession()) return Promise.resolve();
    return getMyOrders().then((rows) => setOrders(rows.map((order) => ({
      id: order.id,
      shipmentId: order.shipmentId,
      fulfillmentStatus: order.status,
      status: order.status === 'delivered' ? 'delivered' : order.status === 'picked_up' ? 'in_transit' : 'pending',
      createdAt: order.createdAt,
      sellerTotal: order.sellerTotal,
      items: (order.items || []).map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        image_url: item.image_url,
      })),
    })))).catch(() => {});
  };

  const advanceOrder = async (order, nextStatus) => {
    if (!order.shipmentId) {
      setMessage('This order parcel is missing its tracking ID. Refresh and try again.');
      return;
    }
    setUpdatingOrderId(order.shipmentId);
    setMessage('');
    try {
      await updateShipmentStatus(order.shipmentId, nextStatus);
      setMessage(nextStatus === 'processing' ? `Packing started for order #${order.id}.` : `Order #${order.id} released to the courier pool.`);
      await loadOrders();
    } catch (error) {
      setMessage(error?.response?.data?.error || error?.error || 'Could not update this order. Refresh and try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const loadReviews = () => {
    if (isLocalDemoSession()) return;
    getMyReviews().then((data) => {
      setReviews(data.reviews || []);
      setScore({ average: data.average || 0, count: data.count || 0 });
    }).catch(() => {});
  };

  const editor = useProductEditor({ onSaved: (note) => { setMessage(note); loadProducts(); } });

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadReviews();
    const timer = window.setInterval(() => { loadOrders(); loadReviews(); }, 10000);
    return () => window.clearInterval(timer);
  }, [user?.email]);

  useEffect(() => {
    if (isLocalDemoSession()) return;
    getMyStore().then((current) => {
      if (!current) return;
      setStore(current);
      setProfile({ name: current.name || '', description: current.description || '', logo_url: current.logo_url || '', contact_email: current.contact_email || user?.email || '', contact_phone: current.contact_phone || user?.phone || '', location: current.location || '' });
      if (current.id) setStorefront(`/stores/${current.id}`);
    }).catch(() => {});
  }, [user?.email]);

  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.description || ''}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const visibleOrders = orders.filter((order) => `${order.id} ${(order.items || []).map((item) => item.name).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const lowStock = products.filter((product) => Number(product.stock) >= 0 && Number(product.stock) < 5);
  const revenue = orders.reduce((sum, order) => sum + Number(order.sellerTotal || 0), 0);
  const inTransit = orders.filter((order) => order.status === 'in_transit').length;
  const delivered = orders.filter((order) => order.status === 'delivered').length;
  const unansweredReviews = reviews.filter((review) => !review.reply);
  const notificationCount = orders.filter((order) => order.status === 'pending').length + lowStock.length + unansweredReviews.length;

  const topProducts = useMemo(() => {
    const totals = new Map();
    orders.forEach((order) => (order.items || []).forEach((item) => {
      const current = totals.get(item.name) || { name: item.name, units: 0 };
      current.units += Number(item.quantity) || 0;
      totals.set(item.name, current);
    }));
    return [...totals.values()].sort((a, b) => b.units - a.units).slice(0, 5);
  }, [orders]);

  const revenueByDay = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + index);
      return { date: date.toLocaleDateString(), day: date.toLocaleDateString(undefined, { weekday: 'short' }), amount: 0 };
    });
    orders.forEach((order) => {
      const row = days.find((day) => day.date === new Date(order.createdAt).toLocaleDateString());
      if (row) row.amount += Number(order.sellerTotal) || 0;
    });
    return days;
  }, [orders]);

  const removeProduct = async () => {
    try {
      await deleteProduct(confirmDelete.id);
      setConfirmDelete(null);
      loadProducts();
    } catch (error) {
      setConfirmDelete(null);
      setMessage(error?.error || error?.message || 'Could not delete that product.');
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!store?.id) return setMessage('Your store profile is not available yet.');
    setSavingProfile(true);
    setMessage('');
    try {
      await updateStore(store.id, profile);
      setStore((current) => ({ ...current, ...profile }));
      setMessage('Store profile updated.');
    } catch (error) {
      setMessage(error?.error || 'Could not update your store profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const sendReply = (reviewId) => {
    const reply = replyDrafts[reviewId];
    if (!reply?.trim()) return;
    replyToReview(reviewId, reply.trim()).then(() => {
      loadReviews();
      setReplyDrafts((current) => ({ ...current, [reviewId]: '' }));
    }).catch((error) => setMessage(error?.error || 'Could not post that reply.'));
  };

  return <div className="flex min-h-screen bg-[#f4f6f2]">
    <Sidebar items={sections} active={active} onSelect={setActive} role="seller" shopName={sellerName} storefrontPath={storefront} />
    <div className="min-w-0 flex-1">
      <Topbar onSearch={setQuery} />
      <SuspendedNotice />
      <main className="mx-auto max-w-screen-2xl space-y-6 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Seller workspace / {sellerName}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">{active === 'Overview' ? 'Shop overview' : active}</h1>
            <p className="mt-1 text-sm text-slate-600">{active === 'Overview' ? 'A clear view of your products, orders, and sales.' : active === 'Products' ? 'Manage your product listings.' : active === 'Orders' ? 'Follow order progress through delivery.' : active === 'Messages' ? 'Reply to customer questions about your shop.' : active === 'Analytics' ? 'Revenue, best sellers, and customer engagement.' : active === 'Promotions' ? 'Schedule discounts on your products.' : active === 'Store profile' ? 'Keep your storefront details up to date.' : active === 'Notifications' ? 'New orders, low stock, and customer feedback.' : ''}</p>
          </div>
          <Link to={storefront} className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-emerald-700 hover:text-emerald-900">View storefront</Link>
        </header>
        {message && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>}

        {active === 'Overview' && <section className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <button type="button" onClick={() => setActive('Orders')} className="text-left"><DashboardCard title="Pending orders" value={orders.filter((order) => order.status === 'pending').length} detail="Need your attention" /></button>
            <button type="button" onClick={() => setActive('Orders')} className="text-left"><DashboardCard title="In transit" value={inTransit} detail="On the way to customers" /></button>
            <button type="button" onClick={() => setActive('Products')} className="text-left"><DashboardCard title="Low stock" value={lowStock.length} detail="Fewer than 5 units" /></button>
            <button type="button" onClick={() => setActive('Products')} className="text-left"><DashboardCard title="Your products" value={products.length} detail="Active shop listings" /></button>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <DashboardCard title="Recent orders" detail="Your shop's latest order activity."><div className="mt-3 divide-y divide-slate-100">{orders.slice(0, 5).map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="font-semibold text-slate-900">Order #{order.id}</p><p className="truncate text-sm text-slate-500">{(order.items || []).map((item) => item.name).join(', ')}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800' : order.status === 'in_transit' ? 'bg-sky-50 text-sky-800' : 'bg-amber-50 text-amber-800'}`}>{deliveryLabel(order.status)}</span></div>)}{!orders.length && <p className="py-4 text-sm text-slate-500">New orders will appear here.</p>}</div><button type="button" onClick={() => setActive('Orders')} className="mt-3 border-t border-slate-100 pt-4 text-sm font-semibold text-emerald-800">Open order tracker</button></DashboardCard>
            <div className="space-y-4"><DashboardCard title="Sales snapshot"><div className="mt-4 flex items-end justify-between gap-4"><div><p className="text-sm text-slate-500">Total seller revenue</p><p className="mt-1 text-3xl font-bold text-slate-950">K{revenue.toFixed(2)}</p></div><div className="text-right"><p className="text-sm text-slate-500">Rating</p><p className="mt-1 text-lg font-bold text-slate-900">{score.count ? `${score.average} / 5` : '—'}</p></div></div><button type="button" onClick={() => setActive('Analytics')} className="mt-5 text-sm font-semibold text-emerald-800">View analytics</button></DashboardCard><button type="button" onClick={() => setActive('Notifications')} className="block w-full text-left"><DashboardCard title="Shop alerts" value={notificationCount} detail="Orders, stock, and feedback" /></button></div>
          </div>
        </section>}

        {active === 'Products' && <DashboardCard title="Your listings" className="overflow-hidden">
          <div className="mt-4 flex justify-end"><button type="button" onClick={editor.openCreate} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Add product</button></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-slate-100 text-slate-400"><tr><th className="py-3">Product</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead><tbody>
            {filteredProducts.map((product) => <tr key={product.id} className="border-b border-slate-50 last:border-0"><td className="py-3"><div className="flex items-center gap-3"><img src={product.image_url || product.images?.[0] || '/images/products/mud-denim.jpg'} alt="" className="h-14 w-12 rounded object-cover" /><div><p className="font-semibold text-slate-900">{product.name}</p><p className="text-xs capitalize text-slate-400">{product.category}</p></div></div></td><td>K{Number(product.price).toFixed(2)}</td><td>{product.stock}</td><td>{Number(product.stock) === 0 ? <span className="text-rose-600">Sold out</span> : Number(product.stock) < 5 ? <span className="text-amber-600">Low stock</span> : <span className="text-emerald-700">In stock</span>}</td><td className="text-right"><button type="button" onClick={() => editor.openEdit(product)} className="mr-3 font-semibold text-emerald-700">Edit</button><button type="button" onClick={() => setConfirmDelete(product)} className="font-semibold text-rose-700">Delete</button></td></tr>)}
            {!filteredProducts.length && <tr><td colSpan={5} className="py-8 text-slate-500">No products match your search.</td></tr>}
          </tbody></table></div>
        </DashboardCard>}

        {active === 'Orders' && <OrderTracker orders={visibleOrders} onAdvance={advanceOrder} busyId={updatingOrderId} />}

        {active === 'Messages' && <StoreMessages role="seller" />}

        {active === 'Analytics' && <AnalyticsViewer revenue={revenue} orders={orders} inTransit={inTransit} delivered={delivered} revenueByDay={revenueByDay} topProducts={topProducts} reviews={reviews} unansweredReviews={unansweredReviews} score={score} />}

        {active === 'Promotions' && <PromotionManager products={products} onMessage={setMessage} />}

        {active === 'Store profile' && <StoreProfileManager store={store} profile={profile} setProfile={setProfile} saving={savingProfile} onSubmit={saveProfile} user={user} />}

        {active === 'Notifications' && <NotificationCenter orders={orders} lowStock={lowStock} unansweredReviews={unansweredReviews} onNavigate={setActive} />}

        {active === 'Reviews' && <DashboardCard title="Customer ratings"><div className="mt-2 flex items-center gap-3"><StarRating value={Math.round(score.average)} readOnly /><p className="text-sm text-slate-500">{score.count ? `${score.average} average from ${score.count} reviews` : 'No ratings yet'}</p></div><div className="mt-5 space-y-4">{reviews.map((review) => <article key={review.id} className="border-b border-slate-100 pb-4 last:border-0"><StarRating value={review.rating} readOnly size="sm" /><p className="mt-2 text-sm text-slate-600">{review.comment || 'Rated after purchase.'}</p><p className="mt-1 text-xs text-slate-400">Order #{review.order_id} · {new Date(review.created_at).toLocaleDateString()}</p>{review.reply ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600"><strong>Your reply:</strong> {review.reply}</p> : <div className="mt-3 flex gap-2"><input value={replyDrafts[review.id] || ''} onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))} placeholder="Write a reply" className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm" /><button type="button" onClick={() => sendReply(review.id)} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Reply</button></div>}</article>)}{!reviews.length && <p className="text-slate-500">Customer ratings will appear here.</p>}</div></DashboardCard>}

        {active === 'Verification' && <DashboardCard title="Shop verification"><div className="mt-4"><VerificationPanel /></div></DashboardCard>}
      </main>
    </div>
    {editor.showForm && <ProductForm form={editor.form} setForm={editor.setForm} message={editor.message} saving={editor.saving} onClose={editor.close} onImages={editor.handleImages} onSubmit={editor.submit} />}
    {confirmDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">Remove this listing?</h2><p className="mt-2 text-sm text-slate-500">{confirmDelete.name} will be removed from your storefront.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setConfirmDelete(null)} className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Cancel</button><button type="button" onClick={removeProduct} className="rounded-md bg-rose-700 px-4 py-2 font-semibold text-white">Delete</button></div></div></div>}
  </div>;
}