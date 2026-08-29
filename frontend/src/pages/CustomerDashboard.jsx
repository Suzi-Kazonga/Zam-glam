import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import DashboardCard from '../components/DashboardCard';
import ProductCard from '../components/ProductCard';
import TrackingTimeline from '../components/TrackingTimeline';
import SellerRatingForm from '../components/SellerRatingForm';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getCustomerOrders, sellersFromOrder, updateOrderStatus } from '../utils/orderStore';
import { getRatings } from '../utils/ratingStore';
import { mergeShopProducts } from '../utils/shopCatalog';

const sections = ['Overview', 'Shop', 'Orders', 'Tracking', 'Cart', 'Ratings', 'Profile', 'Wishlist'];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { getTotalItems, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState(() => getCustomerOrders(user?.email));
  const [products, setProducts] = useState(() => mergeShopProducts());
  const [shopCategory, setShopCategory] = useState('All');
  const [ratingTick, setRatingTick] = useState(0);
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
    const localOrders = getCustomerOrders(user?.email);
    setOrders(localOrders);
    setProducts(mergeShopProducts());
    apiClient.get('/orders').then(({ data }) => {
      if (Array.isArray(data) && data.length) {
        setOrders([...localOrders, ...data.filter((order) => !localOrders.some((item) => String(item.id) === String(order.id)))]);
      }
    }).catch(() => {});
    apiClient.get('/products').then(({ data }) => {
      setProducts(mergeShopProducts(Array.isArray(data) ? data : []));
    }).catch(() => setProducts(mergeShopProducts()));
    const poll = window.setInterval(() => setOrders(getCustomerOrders(user?.email)), 2500);
    return () => window.clearInterval(poll);
  }, [user?.email]);

  const filteredOrders = useMemo(
    () => orders.filter((order) => `${order.id} ${order.items?.[0]?.name || order.name || order.item} ${order.status}`.toLowerCase().includes(query.toLowerCase())),
    [orders, query],
  );
  const markReceived = (orderId) => {
    updateOrderStatus(orderId, 'delivered');
    setOrders(getCustomerOrders(user?.email));
    setRatingTick((value) => value + 1);
  };

  const myRatings = getRatings().filter((rating) => rating.customerEmail === user?.email || rating.customerEmail === 'guest');
  const shopProducts = useMemo(() => products.filter((product) => {
    const searchable = `${product.name} ${product.description || ''} ${product.store_name || product.sellerName || ''}`.toLowerCase();
    const category = searchable.includes('shoe') || String(product.category || '').toLowerCase().includes('shoe') ? 'Shoes' : 'Clothes';
    const matchesSearch = searchable.includes(query.toLowerCase());
    const matchesCategory = shopCategory === 'All' || category === shopCategory;
    return matchesSearch && matchesCategory;
  }), [products, query, shopCategory]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={sections} active={active} onSelect={(section) => { if (section === 'Cart') { navigate('/cart'); return; } setActive(section); }} role="customer" />
      <div className="min-w-0 flex-1">
        <Topbar onSearch={setQuery} />
        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Customer space</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Good to see you, {user?.name?.split(' ')[0] || 'there'}</h1>
            <p className="mt-1 text-slate-500">Shop from here, add items to your bag, track purchases, and rate sellers after you buy.</p>
          </div>

          {active === 'Overview' && (
            <Link to="/products" className="flex w-full items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-5 py-4 text-left">
              <div>
                <p className="font-semibold text-indigo-800">Continue shopping</p>
                <p className="mt-1 text-sm text-indigo-600">Browse the same Zamglam catalog, then checkout from your bag.</p>
              </div>
              <span className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Open shop</span>
            </Link>
          )}

          {active === 'Shop' && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Shop Zamglam</h2>
                  <p className="text-sm text-slate-500">Same catalog as the main shop. Add items, then checkout from your bag.</p>
                </div>
                <div className="flex rounded-lg bg-slate-100 p-1">
                  {['All', 'Clothes', 'Shoes'].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setShopCategory(category)}
                      className={`rounded-md px-4 py-2 text-sm font-semibold ${shopCategory === category ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {shopProducts.length ? shopProducts.map((product) => <ProductCard key={product.id} product={product} />) : (
                  <p className="col-span-full rounded-lg bg-white p-8 text-center text-slate-500">No products match that search.</p>
                )}
              </div>
              <Link to="/products" className="inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800">View the full shop page →</Link>
            </section>
          )}

          {(active === 'Overview' || active === 'Orders') && (
            <section className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <DashboardCard title="Orders" value={orders.length || '0'} detail="All-time orders" />
                <Link to="/cart"><DashboardCard title="Cart" value={`${getTotalItems()} items`} detail={`K${getTotalPrice().toFixed(2)} · Go to checkout`} /></Link>
                <DashboardCard title="Ratings given" value={myRatings.length} detail="Seller reviews after purchase" />
              </div>
              <DashboardCard title="Order history" className="overflow-hidden">
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="border-b border-slate-100 text-slate-400">
                      <tr><th className="py-3">Order ID</th><th>Product</th><th>Status</th><th>Delivery</th></tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length ? filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-4 font-semibold">#{order.id}</td>
                          <td>{order.items?.[0]?.name || order.name || order.item}<span className="block text-xs text-slate-400">Qty: {order.items?.[0]?.quantity || order.quantity || 1}</span></td>
                          <td><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">{order.status}</span></td>
                          <td className="space-x-3 text-slate-500">
                            <Link to={`/orders/${order.id}`} className="font-semibold text-indigo-600 hover:text-indigo-800">Track</Link>
                            {order.status === 'delivered' ? <span>Delivered</span> : (
                              <button type="button" onClick={() => markReceived(order.id)} className="font-semibold text-indigo-600 hover:text-indigo-800">
                                Mark as received
                              </button>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="py-8 text-slate-500">No orders found yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            </section>
          )}

          {active === 'Tracking' && (
            <DashboardCard title="Active deliveries">
              <div className="mt-4 space-y-6">
                {orders.filter((order) => order.status !== 'delivered').length ? orders.filter((order) => order.status !== 'delivered').map((order) => (
                  <div key={order.id} className="border-b border-slate-100 pb-6 last:border-0">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">Order #{order.id}</p>
                        <p className="text-sm text-slate-500">{order.items?.[0]?.name} · {order.address}</p>
                      </div>
                      <Link to={`/orders/${order.id}`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Open tracking</Link>
                    </div>
                    <TrackingTimeline order={order} />
                  </div>
                )) : <p className="text-slate-500">No active deliveries. Completed orders stay in Order history.</p>}
              </div>
            </DashboardCard>
          )}

          {(active === 'Overview' || active === 'Ratings') && (
            <DashboardCard title="Rate sellers after purchase">
              <div className="mt-4 space-y-4">
                {orders.filter((order) => order.status === 'delivered' || order.status === 'purchased').length ? (
                  orders.filter((order) => order.status === 'delivered' || order.status === 'purchased').map((order) => (
                    <div key={`${order.id}-${ratingTick}`} className="space-y-3 border-b border-slate-100 pb-4 last:border-0">
                      <p className="text-sm font-semibold text-slate-700">Order #{order.id}</p>
                      {sellersFromOrder(order.items ? order : { ...order, items: [{ name: order.name || order.item, sellerName: order.store_name || order.sellerName || 'Zamglam seller' }] }).map((seller) => (
                        <SellerRatingForm
                          key={`${order.id}-${seller.sellerName}`}
                          order={order}
                          sellerName={seller.sellerName}
                          productName={seller.productName}
                          customerEmail={user?.email || 'guest'}
                          customerName={user?.name || 'Zamglam shopper'}
                          onSaved={() => setRatingTick((value) => value + 1)}
                        />
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Place an order, then mark it as received to rate the seller.</p>
                )}
              </div>
            </DashboardCard>
          )}

          {active === 'Profile' && (
            <DashboardCard title="Profile">
              <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
                {[['name', 'Full name'], ['email', 'Email'], ['address', 'Address'], ['phone', 'Phone']].map(([key, label]) => (
                  <label key={key} className="text-sm font-medium text-slate-600">{label}
                    <input value={profile[key]} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-300" />
                  </label>
                ))}
                <button className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 sm:col-span-2">Save profile</button>
              </form>
            </DashboardCard>
          )}

          {active === 'Wishlist' && (
            <DashboardCard title="Wishlist">
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {wishlist.length ? wishlist.map((item) => (
                  <div key={item.id} className="border-b border-slate-100 pb-3">
                    <p className="font-semibold">{item.name || item.title}</p>
                    <p className="text-sm text-indigo-700">K{Number(item.price).toFixed(2)}</p>
                  </div>
                )) : <p className="text-slate-500">Your saved products will appear here.</p>}
              </div>
            </DashboardCard>
          )}
        </main>
      </div>
    </div>
  );
}
