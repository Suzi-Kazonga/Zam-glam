import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import ProductForm from '../components/ProductForm';
import StoreMessages from '../components/StoreMessages';
import StarRating from '../components/StarRating';
import PromotionManager from '../components/seller/PromotionManager';
import SellerProductGrid from '../components/seller/SellerProductGrid';
import { AnalyticsViewer, NotificationCenter, OrderTracker, StoreDutyCard, StoreProfileManager } from '../components/seller/SellerSections';
import SuspendedNotice from '../components/SuspendedNotice';
import Topbar from '../components/Topbar';
import VerificationPanel from '../components/VerificationPanel';
import SellerRefundInbox from '../components/SellerRefundInbox';
import { useProductEditor } from '../hooks/useProductEditor';
import { getMyOrders, updateShipmentStatus } from '../api/orderApi';
import { deleteProduct, getSellerProducts } from '../api/productApi';
import { getSellerPromotions } from '../api/dealApi';
import { getMyReviews, replyToReview } from '../api/reviewApi';
import { getMyStore, updateStore } from '../api/storeApi';
import { useAuth } from '../context/AuthContext';
import { isLocalDemoSession } from '../utils/localSession';

const sections = ['Overview', 'Products', 'Orders', 'Messages', 'Refunds', 'Analytics', 'Promotions', 'Store profile', 'Notifications', 'Reviews', 'Verification'];

function formatRestockDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString();
}

function normalizeOpenHours(value) {
  if (!value) return { open: '', close: '' };
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : { open: '', close: '' };
  } catch {
    return { open: '', close: '' };
  }
}

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
  const [promotions, setPromotions] = useState([]);
  const [promotionProductId, setPromotionProductId] = useState('');
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [score, setScore] = useState({ average: 0, count: 0 });
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [store, setStore] = useState(null);
  const [storefront, setStorefront] = useState('/products');
  const [profile, setProfile] = useState({ name: '', description: '', logo_url: '', contact_email: '', contact_phone: '', location: '', open_hours: { open: '', close: '' } });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDuty, setSavingDuty] = useState(false);
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

  const loadPromotions = () => {
    if (isLocalDemoSession()) return Promise.resolve();
    return getSellerPromotions()
      .then((rows) => setPromotions(Array.isArray(rows) ? rows : []))
      .catch(() => setMessage('Could not load your promotion schedule.'));
  };

  const editor = useProductEditor({ onSaved: (note) => { setMessage(note); loadProducts(); } });

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadReviews();
    loadPromotions();
    const timer = window.setInterval(() => { loadOrders(); loadReviews(); }, 10000);
    return () => window.clearInterval(timer);
  }, [user?.email]);

  useEffect(() => {
    if (isLocalDemoSession()) return;
    getMyStore().then((current) => {
      if (!current) return;
      const currentStore = { ...current, open_hours: normalizeOpenHours(current.open_hours) };
      setStore(currentStore);
      setProfile({ name: currentStore.name || '', description: currentStore.description || '', logo_url: currentStore.logo_url || '', contact_email: currentStore.contact_email || user?.email || '', contact_phone: currentStore.contact_phone || user?.phone || '', location: currentStore.location || '', open_hours: currentStore.open_hours });
      if (current.id) setStorefront(`/stores/${current.id}`);
    }).catch(() => setMessage('Could not load your store profile and availability settings.'));
  }, [user?.email]);

  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.description || ''}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const visibleOrders = orders.filter((order) => `${order.id} ${(order.items || []).map((item) => item.name).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const lowStock = products.filter((product) => Number(product.stock) >= 0 && Number(product.stock) < 5);
  const outOfStock = products.filter((product) => Number(product.stock) === 0);
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
  const soldUnitsByName = useMemo(() => Object.fromEntries(topProducts.map((product) => [product.name, product.units])), [topProducts]);

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
    const { open, close } = profile.open_hours || {};
    if (Boolean(open) !== Boolean(close) || (open && close && open >= close)) {
      setMessage('Enter both store hours, with the closing time after opening time.');
      return;
    }
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

  const toggleStoreDuty = async () => {
    if (!store?.id) {
      setMessage('Create or complete your store profile before changing its availability.');
      return;
    }
    const status = store.status === 'closed' ? 'open' : 'closed';
    setSavingDuty(true);
    setMessage('');
    try {
      await updateStore(store.id, { status });
      setStore((current) => ({ ...current, status }));
      setMessage(status === 'open' ? 'Your storefront is on duty.' : 'Your storefront is off duty.');
    } catch (error) {
      setMessage(error?.response?.data?.error || error?.error || 'Could not update store availability.');
    } finally {
      setSavingDuty(false);
    }
  };

  const promoteProduct = (product) => {
    setPromotionProductId(String(product.id));
    setActive('Promotions');
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
    <div className="min-w-0 flex-1">
      <Topbar onSearch={setQuery} navigationItems={sections} activeNavigation={active} onNavigationSelect={setActive} />
      <SuspendedNotice />
      <main className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Seller workspace / {sellerName}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">{active === 'Overview' ? 'Shop overview' : active}</h1>
            <p className="mt-1 text-sm text-slate-600">{active === 'Overview' ? 'A clear view of your products, orders, and sales.' : active === 'Products' ? 'Manage your product listings.' : active === 'Orders' ? 'Follow order progress through delivery.' : active === 'Messages' ? 'Reply to customer questions about your shop.' : active === 'Refunds' ? 'Discuss customer concerns and recommend a solution for admin review.' : active === 'Analytics' ? 'Revenue, best sellers, and customer engagement.' : active === 'Promotions' ? 'Schedule discounts on your products.' : active === 'Store profile' ? 'Keep your storefront details up to date.' : active === 'Notifications' ? 'New orders, low stock, and customer feedback.' : ''}</p>
          </div>
          <Link to={storefront} className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-emerald-700 hover:text-emerald-900">View storefront</Link>
        </header>
        {message && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>}

        {active === 'Overview' && <section className="space-y-5">
          <StoreDutyCard store={store} saving={savingDuty} onToggle={toggleStoreDuty} onManageHours={() => setActive('Store profile')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <button type="button" onClick={() => setActive('Orders')} className="text-left"><DashboardCard title="Pending orders" value={orders.filter((order) => order.status === 'pending').length} detail="Need your attention" /></button>
            <button type="button" onClick={() => setActive('Orders')} className="text-left"><DashboardCard title="In transit" value={inTransit} detail="On the way to customers" /></button>
            <button type="button" onClick={() => setActive('Products')} className="text-left"><DashboardCard title="Low stock" value={lowStock.length} detail="Fewer than 5 units" /></button>
            <button type="button" onClick={() => setActive('Products')} className="text-left"><DashboardCard title="Your products" value={products.length} detail="Clothes and shop listings" /></button>
          </div>
          <DashboardCard title="Your shop floor" detail="See what's available, update stock, or quickly schedule a sale.">
            <div className="mt-4">
              <SellerProductGrid
                products={products.slice(0, 8)}
                promotions={promotions}
                soldUnits={soldUnitsByName}
                onAdd={editor.openCreate}
                onEdit={editor.openEdit}
                onPromote={promoteProduct}
              />
            </div>
            {products.length > 8 && <button type="button" onClick={() => setActive('Products')} className="mt-4 text-sm font-semibold text-emerald-800">View all {products.length} products</button>}
          </DashboardCard>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DashboardCard title="Out of stock" detail="Add stock and an expected restock date to let customers know when items return.">
              <div className="mt-3 divide-y divide-slate-100">
                {outOfStock.map((product) => <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div><p className="font-semibold text-slate-900">{product.name}</p><p className="text-sm text-slate-500">{product.restock_expected_at ? `Expected ${formatRestockDate(product.restock_expected_at)}` : 'No restock date set'}</p></div>
                  <button type="button" onClick={() => editor.openEdit(product)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Update stock</button>
                </div>)}
                {!outOfStock.length && <p className="py-4 text-sm text-slate-500">Nothing is out of stock.</p>}
              </div>
            </DashboardCard>
            <DashboardCard title="Most sold" detail="Best-selling products based on your shop orders.">
              <div className="mt-3 divide-y divide-slate-100">
                {topProducts.map((product, index) => <div key={product.name} className="flex items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-800">{index + 1}</span><span className="truncate font-semibold text-slate-800">{product.name}</span></div><span className="shrink-0 text-sm font-semibold text-slate-600">{product.units} sold</span></div>)}
                {!topProducts.length && <p className="py-4 text-sm text-slate-500">Sales rankings will appear when orders come in.</p>}
              </div>
            </DashboardCard>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <DashboardCard title="Recent orders" detail="Your shop's latest order activity."><div className="mt-3 divide-y divide-slate-100">{orders.slice(0, 5).map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="font-semibold text-slate-900">Order #{order.id}</p><p className="truncate text-sm text-slate-500">{(order.items || []).map((item) => item.name).join(', ')}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800' : order.status === 'in_transit' ? 'bg-sky-50 text-sky-800' : 'bg-amber-50 text-amber-800'}`}>{deliveryLabel(order.status)}</span></div>)}{!orders.length && <p className="py-4 text-sm text-slate-500">New orders will appear here.</p>}</div><button type="button" onClick={() => setActive('Orders')} className="mt-3 border-t border-slate-100 pt-4 text-sm font-semibold text-emerald-800">Open order tracker</button></DashboardCard>
            <div className="space-y-4"><DashboardCard title="Sales snapshot"><div className="mt-4 flex items-end justify-between gap-4"><div><p className="text-sm text-slate-500">Total seller revenue</p><p className="mt-1 text-3xl font-bold text-slate-950">K{revenue.toFixed(2)}</p></div><div className="text-right"><p className="text-sm text-slate-500">Rating</p><p className="mt-1 text-lg font-bold text-slate-900">{score.count ? `${score.average} / 5` : '—'}</p></div></div><button type="button" onClick={() => setActive('Analytics')} className="mt-5 text-sm font-semibold text-emerald-800">View analytics</button></DashboardCard><button type="button" onClick={() => setActive('Notifications')} className="block w-full text-left"><DashboardCard title="Shop alerts" value={notificationCount} detail="Orders, stock, and feedback" /></button></div>
          </div>
        </section>}

        {active === 'Products' && <DashboardCard title="Your inventory" detail="Your clothes and products, with stock and promotion status.">
          {query && !filteredProducts.length ? <p className="mt-4 text-sm text-slate-500">No products match “{query}”.</p> : <div className="mt-4">
            <SellerProductGrid
              products={filteredProducts}
              promotions={promotions}
              soldUnits={soldUnitsByName}
              onAdd={editor.openCreate}
              onEdit={editor.openEdit}
              onPromote={promoteProduct}
            />
          </div>}
          {filteredProducts.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Remove a listing</p>
            <div className="flex flex-wrap gap-2">{filteredProducts.map((product) => <button key={product.id} type="button" onClick={() => setConfirmDelete(product)} className="rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete {product.name}</button>)}</div>
          </div>}
        </DashboardCard>}

        {active === 'Orders' && <OrderTracker orders={visibleOrders} onAdvance={advanceOrder} busyId={updatingOrderId} />}

        {active === 'Messages' && <StoreMessages role="seller" />}

        {active === 'Refunds' && <SellerRefundInbox />}

        {active === 'Analytics' && <AnalyticsViewer revenue={revenue} orders={orders} inTransit={inTransit} delivered={delivered} revenueByDay={revenueByDay} topProducts={topProducts} reviews={reviews} unansweredReviews={unansweredReviews} score={score} />}

        {active === 'Promotions' && <PromotionManager products={products} onMessage={setMessage} initialProductId={promotionProductId} />}

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