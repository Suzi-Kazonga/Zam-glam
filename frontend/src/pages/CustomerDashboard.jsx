// The shopper’s dashboard: their orders, basket, profile and saved items.

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import apiClient from '../api/axios';
import DashboardCard from '../components/DashboardCard';
import ProductCard from '../components/ProductCard';
import StoreMessages from '../components/StoreMessages';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SuspendedNotice from '../components/SuspendedNotice';
import HeroBanner from '../components/HeroBanner';
import CategoryNav from '../components/CategoryNav';
import StoreCard from '../components/StoreCard';
import FeaturedDeals from '../components/FeaturedDeals';
import { getAllStores } from '../api/storeApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMyOrders } from '../api/orderApi';


const sections = ['Overview', 'Orders', 'Products', 'Messages', 'Cart', 'Collections', 'Profile', 'Wishlist'];
const fallbackStores = [{ name: 'Mud', file: 'mud' }, { name: 'Jets', file: 'jets' }, { name: 'Bata', file: 'bata' }, { name: 'Pep', file: 'pep' }, { name: 'Mr Price Zambia', file: 'mrprice' }, { name: 'Fashions Galore', file: 'fashionsgalore' }].map((store, id) => ({ id: id + 1, name: store.name, logo_url: `/images/logos/${store.file}.png` }));

export default function CustomerDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const { cart, getTotalItems, getTotalPrice } = useCart();
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState(fallbackStores);
  const [storeSearch, setStoreSearch] = useState('');
  const [wishlist] = useState(() => {
    try {
      const storedWishlist = JSON.parse(localStorage.getItem('zamglam_wishlist') || '[]');
      return Array.isArray(storedWishlist) ? storedWishlist : [];
    } catch {
      localStorage.removeItem('zamglam_wishlist');
      return [];
    }
  });

  useEffect(() => {
    const requested = new URLSearchParams(location.search).get('section');
    if (sections.includes(requested)) setActive(requested);
  }, [location.search]);

  useEffect(() => {
    apiClient.get('/products').then(({ data }) => setProducts(Array.isArray(data) ? data : [])).catch(() => setProducts([]));
    getAllStores().then((response) => {
      if (Array.isArray(response) && response.length) setStores(response);
    }).catch(() => setStores(fallbackStores));
    getMyOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  const orderSummary = (order) => (order.items || []).map((item) => `${item.name} x${item.quantity}`).join(', ');
  const packageProgress = (order) => {
    const total = order.shipments?.length || 0;
    if (!total) return '—';
    const done = order.shipments.filter((shipment) => shipment.status === 'delivered').length;
    return `${done}/${total} package${total > 1 ? 's' : ''} delivered`;
  };
  const filteredOrders = useMemo(
    () => orders.filter((order) => `${order.id} ${orderSummary(order)} ${order.status}`.toLowerCase().includes(query.toLowerCase())),
    [orders, query],
  );
  const matchingProducts = useMemo(
    () => products.filter((product) => `${product.name} ${product.description || ''}`.toLowerCase().includes(`${query} ${storeSearch}`.toLowerCase())),
    [products, query, storeSearch],
  );
  const filteredProducts = matchingProducts.slice(0, 8);
  const filteredStores = useMemo(
    () => stores.filter((store) => `${store.name}`.toLowerCase().includes(`${query} ${storeSearch}`.toLowerCase())),
    [stores, query, storeSearch],
  );

  return <div className="flex min-h-screen bg-white"><Sidebar items={sections} active={active} onSelect={setActive} role="customer" /><div className="min-w-0 flex-1"><Topbar onSearch={(value) => { setQuery(value); if (value) setActive('Products'); }} /><SuspendedNotice /><main className="mx-auto max-w-7xl space-y-6 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">
    <div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Customer space</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Good to see you, {user?.name?.split(' ')[0] || 'there'}</h1><p className="mt-1 text-slate-500">Keep an eye on your orders and your next favorite find.</p></div>

    {active === 'Overview' && (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <button type="button" onClick={() => setActive('Orders')} className="text-left"><DashboardCard title="Orders" value={orders.length || '0'} detail="View and track orders" /></button>
          <button type="button" onClick={() => setActive('Cart')} className="text-left"><DashboardCard title="Cart" value={`${getTotalItems()} items`} detail={`K${getTotalPrice().toFixed(2)} selected`} /></button>
          <button type="button" onClick={() => setActive('Wishlist')} className="text-left"><DashboardCard title="Wishlist" value={wishlist.length} detail="Saved for later" /></button>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Your account</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Recent orders</h2>
            </div>
            <button type="button" onClick={() => setActive('Orders')} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">View all</button>
          </div>
          {orders.length ? (
            <div className="divide-y divide-slate-100">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold text-slate-800">Order #{order.id}</p>
                    <p className="mt-1 text-sm text-slate-500">{orderSummary(order) || 'Order details'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">{order.status}</span>
                    <Link to={`/orders/${order.id}`} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">Track</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center">
              <p className="text-sm text-slate-500">Your orders will appear here after checkout.</p>
              <button type="button" onClick={() => setActive('Products')} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Browse products</button>
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Picked for you</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Popular products</h2>
            </div>
            <button type="button" onClick={() => setActive('Products')} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">Browse all products</button>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{filteredProducts.length ? filteredProducts.map((product) => <ProductCard key={product.id} product={product} />) : <p className="col-span-full py-12 text-center text-slate-500">No products are available yet.</p>}</div>
        </section>
      </div>
    )}

    {active === 'Orders' && <section className="space-y-4"><DashboardCard title="Order history" className="overflow-hidden"><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-100 text-slate-400"><tr><th className="py-3">Order ID</th><th>Items</th><th>Packages</th><th>Status</th><th></th></tr></thead><tbody>
      {filteredOrders.length ? filteredOrders.map((order) => <tr key={order.id} className="border-b border-slate-50 last:border-0">
        <td className="py-4 font-semibold">#{order.id}</td>
        <td className="max-w-xs"><span className="block truncate">{orderSummary(order)}</span></td>
        <td>
          <span className="font-semibold text-slate-700">{packageProgress(order)}</span>
          {order.shipments?.length > 1 && <span className="block text-xs text-slate-400">{order.shipments.map((s, i) => `${i + 1}/${order.shipments.length} ${s.storeName}: ${s.status}`).join(' · ')}</span>}
        </td>
        <td><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">{order.status}</span></td>
        <td><Link to={`/orders/${order.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Track</Link></td>
      </tr>) : <tr><td colSpan="5" className="py-6 text-center text-slate-500">No orders found yet.</td></tr>}
    </tbody></table></div></DashboardCard></section>}
    {active === 'Products' && <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Marketplace</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{query ? `Results for “${query}”` : 'All products'}</h2></div>
        <Link to="/products" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">Advanced filters</Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{matchingProducts.length ? matchingProducts.map((product) => <ProductCard key={product.id} product={product} />) : <p className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-500">No products match your search.</p>}</div>
    </section>}
    {active === 'Messages' && <StoreMessages role="customer" stores={stores} />}
    {active === 'Cart' && <DashboardCard title="Cart summary"><div className="mt-4 space-y-3">{cart.length ? cart.map((item) => <div key={item.id} className="flex justify-between border-b border-slate-100 py-3"><span>{item.name || item.title} × {item.quantity}</span><strong>K{(item.price * item.quantity).toFixed(2)}</strong></div>) : <p className="text-slate-500">Your cart is empty.</p>}<div className="flex justify-between pt-3 text-lg font-bold"><span>Total</span><span>K{getTotalPrice().toFixed(2)}</span></div><Link to="/cart" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Checkout</Link></div></DashboardCard>}
    {active === 'Collections' && <div className="space-y-8">
      <HeroBanner />
      <CategoryNav />
      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">The Zamglam marketplace</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Featured stores</h2></div><input value={storeSearch} onChange={(event) => setStoreSearch(event.target.value)} placeholder="Filter stores" className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-300 sm:w-64" /></div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">{filteredStores.length ? filteredStores.map((store) => <StoreCard key={store.id} store={store} />) : <p className="col-span-full py-10 text-center text-slate-500">No stores match your search.</p>}</div>
      </section>
      <FeaturedDeals />
    </div>}
    {active === 'Profile' && <DashboardCard title="Profile"><div className="mt-4 grid gap-4 sm:grid-cols-2">{[['Full name', user?.name], ['Email', user?.email], ['Phone', user?.phone], ['Location', user?.location || user?.address]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-medium text-slate-800">{value || 'Not provided'}</p></div>)}</div><Link to="/account" className="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700">Manage account</Link></DashboardCard>}
    {active === 'Wishlist' && <DashboardCard title="Wishlist"><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{wishlist.length ? wishlist.map((item) => <div key={item.id} className="border-b border-slate-100 pb-3"><p className="font-semibold">{item.name || item.title}</p><p className="text-sm text-indigo-700">K{Number(item.price).toFixed(2)}</p></div>) : <p className="text-slate-500">Your saved products will appear here.</p>}</div></DashboardCard>}
  </main></div></div>;
}
