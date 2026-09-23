// The shopper’s dashboard: their orders, basket, profile and saved items.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import DashboardCard from '../components/DashboardCard';
import ProductCard from '../components/ProductCard';

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


const sections = ['Overview', 'Orders', 'Cart', 'Profile', 'Wishlist'];
const fallbackStores = [{ name: 'Mud', file: 'mud' }, { name: 'Jets', file: 'jets' }, { name: 'Bata', file: 'bata' }, { name: 'Pep', file: 'pep' }, { name: 'Mr Price Zambia', file: 'mrprice' }, { name: 'Fashions Galore', file: 'fashionsgalore' }].map((store, id) => ({ id: id + 1, name: store.name, logo_url: `/images/logos/${store.file}.png` }));

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { cart, getTotalItems, getTotalPrice } = useCart();
  const listingStorageKey = `zamglam_customer_listings_${user?.id || user?.email || 'guest'}`;
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState(fallbackStores);
  const [storeSearch, setStoreSearch] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [listingError, setListingError] = useState('');
  const [listing, setListing] = useState({ name: '', description: '', price: '', category: '', image: '' });
  const [customerListings, setCustomerListings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(listingStorageKey) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', address: '', phone: user?.phone || '' });
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
  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.description || ''}`.toLowerCase().includes(storeSearch.toLowerCase())).slice(0, 8), [products, storeSearch]);
  const filteredStores = useMemo(() => stores.filter((store) => `${store.name}`.toLowerCase().includes(storeSearch.toLowerCase())), [stores, storeSearch]);

  const updateListing = (event) => setListing({ ...listing, [event.target.name]: event.target.value });
  const handleListingImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setListing((current) => ({ ...current, image: reader.result }));
    reader.readAsDataURL(file);
  };
  const handleListingSubmit = (event) => {
    event.preventDefault();
    if (!listing.image) {
      setListingError('Please choose an image for your item.');
      return;
    }
    const nextListing = { ...listing, id: `customer-${Date.now()}`, price: Number(listing.price), owner: user?.name || 'You' };
    const nextListings = [nextListing, ...customerListings];
    setCustomerListings(nextListings);
    localStorage.setItem(listingStorageKey, JSON.stringify(nextListings));
    setListing({ name: '', description: '', price: '', category: '', image: '' });
    setListingError('');
    setShowPostForm(false);
  };

  return <div className="flex min-h-screen bg-gray-50"><Sidebar items={sections} active={active} onSelect={setActive} role="customer" /><div className="min-w-0 flex-1"><Topbar onSearch={setQuery} /><SuspendedNotice /><main className="mx-auto max-w-7xl space-y-6 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Customer space</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Good to see you, {user?.name?.split(' ')[0] || 'there'}</h1><p className="mt-1 text-slate-500">Keep an eye on your orders and your next favorite find.</p></div><button type="button" onClick={() => setShowPostForm((visible) => !visible)} className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2">{showPostForm ? 'Close form' : 'Post item'}</button></div>

    {showPostForm && <section className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm" aria-labelledby="post-item-heading"><h2 id="post-item-heading" className="text-xl font-bold text-slate-900">Post clothes for sale</h2><p className="mt-1 text-sm text-slate-500">Your listing is saved to this account and appears below.</p><form onSubmit={handleListingSubmit} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Item name<input required name="name" value={listing.name} onChange={updateListing} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Price (K)<input required min="0" step="0.01" type="number" name="price" value={listing.price} onChange={updateListing} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Category<input required name="category" value={listing.category} onChange={updateListing} placeholder="Dresses, shoes..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Image<input required accept="image/*" type="file" onChange={handleListingImage} className="mt-1 block w-full text-sm" /></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Description<textarea required name="description" value={listing.description} onChange={updateListing} rows="3" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>{listingError && <p className="text-sm font-semibold text-red-600 sm:col-span-2" role="alert">{listingError}</p>}<button type="submit" className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 sm:col-span-2">Publish item</button></form></section>}

    {customerListings.length > 0 && <section><h2 className="text-2xl font-bold text-slate-900">Your posted items</h2><div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{customerListings.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><img src={item.image} alt={item.name} className="h-48 w-full object-cover" /><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{item.category}</p><h3 className="mt-1 font-bold text-slate-900">{item.name}</h3><p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.description}</p><p className="mt-3 font-bold text-indigo-700">K{Number(item.price).toFixed(2)}</p></div></article>)}</div></section>}

    {active === 'Overview' && (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardCard title="Orders" value={orders.length || '0'} detail="All-time orders" />
          <DashboardCard title="Cart" value={`${getTotalItems()} items`} detail={`K${getTotalPrice().toFixed(2)} selected`} />
          <DashboardCard title="Wishlist" value={wishlist.length} detail="Saved for later" />
        </div>

        <HeroBanner />
        <CategoryNav />

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">The Zamglam marketplace</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Choose your store</h2>
            </div>
            <input value={storeSearch} onChange={(event) => setStoreSearch(event.target.value)} placeholder="Filter stores" className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-300 sm:w-64" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">{filteredStores.length ? filteredStores.map((store) => <StoreCard key={store.id} store={store} />) : <p className="col-span-full py-10 text-center text-slate-500">No stores match your search.</p>}</div>
        </section>

        <FeaturedDeals />

        <section className="mt-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Curated for you</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Trending now</h2>
            </div>
            <input value={storeSearch} onChange={(event) => setStoreSearch(event.target.value)} placeholder="Filter featured styles" className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-300 sm:w-64" />
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{filteredProducts.length ? filteredProducts.map((product) => <ProductCard key={product.id} product={product} />) : <p className="col-span-full py-12 text-center text-slate-500">No products are available yet.</p>}</div>
          <div className="mt-10 text-center"><Link to="/products" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:border-indigo-600 hover:text-indigo-600">View all products</Link></div>
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
    {active === 'Cart' && <DashboardCard title="Cart summary"><div className="mt-4 space-y-3">{cart.length ? cart.map((item) => <div key={item.id} className="flex justify-between border-b border-slate-100 py-3"><span>{item.name || item.title} × {item.quantity}</span><strong>K{(item.price * item.quantity).toFixed(2)}</strong></div>) : <p className="text-slate-500">Your cart is empty.</p>}<div className="flex justify-between pt-3 text-lg font-bold"><span>Total</span><span>K{getTotalPrice().toFixed(2)}</span></div><Link to="/cart" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Checkout</Link></div></DashboardCard>}
    {active === 'Profile' && <DashboardCard title="Profile"><form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>{[['name', 'Full name'], ['email', 'Email'], ['address', 'Address'], ['phone', 'Phone']].map(([key, label]) => <label key={key} className="text-sm font-medium text-slate-600">{label}<input value={profile[key]} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-300" /></label>)}<button className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 sm:col-span-2">Save profile</button></form></DashboardCard>}
    {active === 'Wishlist' && <DashboardCard title="Wishlist"><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{wishlist.length ? wishlist.map((item) => <div key={item.id} className="border-b border-slate-100 pb-3"><p className="font-semibold">{item.name || item.title}</p><p className="text-sm text-indigo-700">K{Number(item.price).toFixed(2)}</p></div>) : <p className="text-slate-500">Your saved products will appear here.</p>}</div></DashboardCard>}
  </main></div></div>;
}
