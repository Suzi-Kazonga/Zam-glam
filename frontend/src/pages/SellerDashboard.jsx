import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import Sidebar from '../components/Sidebar';
import StarRating from '../components/StarRating';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { filesToDataUrls } from '../utils/image';
import { getMyOrders, updateShipmentStatus } from '../api/orderApi';
import { isLocalDemoSession } from '../utils/localSession';
import { getSellerRatings, getSellerScore, replyToRating } from '../utils/ratingStore';
import { getStorefrontPath } from '../utils/storeLogos';
import { createProduct, deleteProduct, getSellerProducts } from '../api/productApi';

const sections = ['Overview', 'Products', 'Orders', 'Reviews', 'Analytics'];
const emptyForm = { id: '', name: '', description: '', price: '', stock: '', category: 'clothes', image_url: '', imageFiles: [], previews: [] };
// A seller hands the parcel over and stops there — only the assigned courier can
// declare it delivered, so there is deliberately no 'shipped' action here.
const nextAction = {
  placed: { status: 'processing', label: 'Start packing' },
  processing: { status: 'shipped', label: 'Hand to courier' },
};

function ProductForm({ form, setForm, message, onClose, onImages, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">{form.id ? 'Edit product' : 'Add product'}</h2>
        <p className="mt-1 text-sm text-slate-500">Customers will see this on your storefront.</p>
        <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium text-slate-600">Product name
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300" />
          </label>
          <label className="block text-sm font-medium text-slate-600">Description
            <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-600">Price (ZMW)
              <input required type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300" />
            </label>
            <label className="block text-sm font-medium text-slate-600">Stock
              <input required type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300" />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-600">Category
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300">
              <option value="clothes">Clothes</option>
              <option value="shoes">Shoes</option>
            </select>
          </label>
          <label className="block rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            Upload product images
            <input type="file" accept="image/*" multiple onChange={(event) => onImages(event.target.files)} className="mt-2 w-full text-xs" />
          </label>
          {form.previews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.previews.map((src) => <img key={src} src={src} alt="" className="h-20 w-16 rounded object-cover" />)}
            </div>
          )}
          {message && <p className="text-sm text-purple-800">{message}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">Cancel</button>
          <button className="rounded-lg bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-800">Save product</button>
        </div>
      </form>
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [savedProduct, setSavedProduct] = useState(null);
  const [orderFilter, setOrderFilter] = useState('action');
  const [replyDrafts, setReplyDrafts] = useState({});
  const sellerName = user?.shop_name || user?.name || 'My Shop';
  const storefront = getStorefrontPath(sellerName);
  const score = getSellerScore(sellerName);

  const loadOrders = () => {
    if (isLocalDemoSession()) return;
    getMyOrders().then(setOrders).catch(() => {});
  };

  const loadProducts = () => {
    getSellerProducts()
      .then((remote) => setProducts(Array.isArray(remote) ? remote : []))
      .catch(() => setMessage('Could not load your products.'));
  };

  const loadData = () => {
    loadProducts();
    loadOrders();
    setReviews(getSellerRatings(sellerName));
  };

  useEffect(() => {
    loadData();
    const poll = window.setInterval(() => {
      loadOrders();
      setReviews(getSellerRatings(sellerName));
    }, 5000);
    return () => window.clearInterval(poll);
  }, [user?.email, sellerName]);

  const filteredProducts = useMemo(
    () => products.filter((product) => `${product.name} ${product.description || ''}`.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  );
  // "Needs action" means the seller still has something to do; once handed to the courier
  // the parcel is out of their hands.
  const actionOrders = orders.filter((order) => Boolean(nextAction[order.status]));
  const visibleOrders = (orderFilter === 'action' ? actionOrders : orders).filter((order) => `${order.id} ${order.items?.[0]?.name || ''} ${order.customerName || ''}`.toLowerCase().includes(query.toLowerCase()));
  const lowStock = products.filter((product) => Number(product.stock) > 0 && Number(product.stock) < 5);
  const revenue = orders.reduce((total, order) => total + Number(order.total || order.price || 0), 0);
  const statusCounts = {
    placed: orders.filter((order) => order.status === 'placed').length,
    processing: orders.filter((order) => order.status === 'processing').length,
    shipped: orders.filter((order) => order.status === 'shipped').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
  };

  const handleImages = async (files) => {
    const previews = await filesToDataUrls(files);
    setForm((current) => ({ ...current, imageFiles: Array.from(files), previews, image_url: previews[0] || current.image_url }));
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    setMessage('');
    const images = form.previews.length ? form.previews : (form.image_url ? [form.image_url] : []);
    if (!images.length) {
      setMessage('Add at least one product image.');
      return;
    }
    const payload = {
      id: form.id || undefined,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      image_url: images[0],
      images,
      sellerEmail: user?.email,
      sellerName,
      store_name: sellerName,
    };
    // Saved straight to the backend: a product that only existed in this browser could be
    // browsed but never ordered, because checkout looks products up server-side.
    try {
      await createProduct({ ...payload, imageFile: form.imageFiles[0] || null });
      setSavedProduct(payload);
      setForm(emptyForm);
      setShowForm(false);
      setMessage(form.id ? 'Product updated.' : 'Product listed on your storefront.');
      loadProducts();
    } catch (error) {
      setMessage(error?.error || error?.message || 'Could not save that product. Please try again.');
    }
  };

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

  // Acts on this store's own parcel only — other stores in the same order are untouched.
  const advanceOrder = async (order) => {
    const action = nextAction[order.status];
    if (!action || !order.shipmentId) return;
    try {
      await updateShipmentStatus(order.shipmentId, action.status);
      loadOrders();
    } catch {
      setMessage('Could not update that parcel. Please try again.');
    }
  };

  const sendReply = (ratingId) => {
    const reply = replyDrafts[ratingId];
    if (!reply?.trim()) return;
    replyToRating(ratingId, reply.trim());
    setReviews(getSellerRatings(sellerName));
    setReplyDrafts((current) => ({ ...current, [ratingId]: '' }));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={sections} active={active} onSelect={setActive} role="seller" shopName={sellerName} />
      <div className="min-w-0 flex-1">
        <Topbar onSearch={setQuery} />
        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-purple-700">{sellerName} studio</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {active === 'Overview' ? `Today at ${sellerName}` : active}
              </h1>
              <p className="mt-1 text-slate-500">
                {active === 'Overview' && 'Pack orders, watch stock, and keep your storefront current.'}
                {active === 'Products' && 'List items the way customers will see them.'}
                {active === 'Orders' && 'Move each order one step: pack, hand to courier, then delivered.'}
                {active === 'Reviews' && 'Read ratings and reply after a customer receives an order.'}
                {active === 'Analytics' && 'A simple view of orders and revenue.'}
              </p>
            </div>
            <Link to={storefront} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-purple-700 hover:text-purple-700">View storefront</Link>
          </div>

          {active === 'Overview' && (
            <section className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button type="button" onClick={() => setActive('Orders')} className="text-left"><DashboardCard title="Needs action" value={actionOrders.length} detail="Orders still in progress" /></button>
                <button type="button" onClick={() => setActive('Products')} className="text-left"><DashboardCard title="Low stock" value={lowStock.length} detail="Fewer than 5 units" /></button>
                <button type="button" onClick={() => setActive('Products')} className="text-left"><DashboardCard title="Products" value={products.length} detail="Live listings" /></button>
                <button type="button" onClick={() => setActive('Reviews')} className="text-left"><DashboardCard title="Seller rating" value={score.count ? `${score.average} ★` : '—'} detail={score.count ? `${score.count} reviews` : 'No ratings yet'} /></button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <DashboardCard title="Orders to pack">
                  <div className="mt-4 space-y-3">
                    {actionOrders.length ? actionOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
                        <div>
                          <p className="font-semibold">{order.items?.[0]?.name}</p>
                          <p className="text-sm capitalize text-slate-500">{order.status} · {order.customerName || 'Customer'}</p>
                        </div>
                        <button type="button" onClick={() => setActive('Orders')} className="text-sm font-semibold text-purple-700">Open</button>
                      </div>
                    )) : <p className="text-slate-500">No open orders. New sales will appear here.</p>}
                  </div>
                </DashboardCard>
                <DashboardCard title="Latest rating">
                  {reviews[0] ? (
                    <div className="mt-4">
                      <StarRating value={reviews[0].stars} readOnly size="sm" />
                      <p className="mt-2 text-sm text-slate-600">{reviews[0].comment || 'Rated after purchase.'}</p>
                      <p className="mt-1 text-xs text-slate-400">{reviews[0].customerName} · {reviews[0].productName}</p>
                    </div>
                  ) : <p className="mt-4 text-slate-500">When a customer marks an order received, their rating appears here.</p>}
                </DashboardCard>
              </div>
            </section>
          )}

          {active === 'Products' && (
            <DashboardCard title="Your listings" className="overflow-hidden">
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => { setForm(emptyForm); setShowForm(true); setMessage(''); }} className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800">Add product</button>
              </div>
              {savedProduct && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Listed as customers will see it</p>
                  <div className="mt-3 flex items-center gap-3">
                    <img src={savedProduct.image_url} alt="" className="h-16 w-14 rounded object-cover" />
                    <div>
                      <p className="font-semibold">{savedProduct.name}</p>
                      <p className="text-sm text-slate-600">K{Number(savedProduct.price).toFixed(2)} · {savedProduct.stock} in stock</p>
                      <Link to={storefront} className="text-sm font-semibold text-purple-700">View on storefront</Link>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-slate-100 text-slate-400">
                    <tr><th className="py-3">Product</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length ? filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img src={product.image_url || product.images?.[0] || '/images/products/mud-denim.jpg'} alt="" className="h-14 w-12 rounded object-cover" />
                            <div>
                              <p className="font-semibold text-slate-900">{product.name}</p>
                              <p className="text-xs capitalize text-slate-400">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td>K{Number(product.price).toFixed(2)}</td>
                        <td>{product.stock}</td>
                        <td>{Number(product.stock) === 0 ? <span className="text-rose-600">Sold out</span> : Number(product.stock) < 5 ? <span className="text-amber-600">Low stock</span> : <span className="text-emerald-600">In stock</span>}</td>
                        <td className="text-right">
                          <button type="button" onClick={() => { setForm({ id: product.id, name: product.name, description: product.description || '', price: product.price, stock: product.stock, category: product.category || 'clothes', image_url: product.image_url || '', imageFiles: [], previews: product.images || (product.image_url ? [product.image_url] : []) }); setShowForm(true); }} className="mr-2 font-semibold text-purple-700">Edit</button>
                          <button type="button" onClick={() => setConfirmDelete(product)} className="font-semibold text-rose-600">Delete</button>
                        </td>
                      </tr>
                    )) : <tr><td colSpan={5} className="py-8 text-slate-500">No products match your search.</td></tr>}
                  </tbody>
                </table>
              </div>
            </DashboardCard>
          )}

          {active === 'Orders' && (
            <DashboardCard title="Fulfillment">
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setOrderFilter('action')} className={`rounded-full px-3 py-1 text-sm font-semibold ${orderFilter === 'action' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'}`}>Needs action</button>
                <button type="button" onClick={() => setOrderFilter('all')} className={`rounded-full px-3 py-1 text-sm font-semibold ${orderFilter === 'all' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'}`}>All orders</button>
              </div>
              <div className="mt-5 space-y-4">
                {visibleOrders.length ? visibleOrders.map((order) => {
                  const action = nextAction[order.status];
                  const item = order.items?.[0] || {};
                  return (
                    <article key={order.id} className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 p-4">
                      <div className="flex gap-3">
                        <img src={item.image_url || '/images/products/mud-denim.jpg'} alt="" className="h-20 w-16 rounded object-cover" />
                        <div>
                          <p className="font-semibold">Order #{order.id} · your parcel</p>
                          <p className="text-sm text-slate-700">{(order.items || []).map((line) => `${line.name} x${line.quantity}`).join(', ') || item.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{order.customerName || 'Customer'} · {order.phone || 'No phone'}</p>
                          <p className="text-sm text-slate-500">{order.address || 'No address'}</p>
                          <p className="mt-1 text-xs capitalize text-slate-400">{order.status} · K{Number(order.total || item.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/orders/${order.id}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Track</Link>
                        {action ? (
                          <button type="button" onClick={() => advanceOrder(order)} className="rounded-lg bg-purple-700 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-800">{action.label}</button>
                        ) : order.status === 'shipped' ? (
                          <span className="text-right text-sm font-semibold text-amber-700">
                            With courier{order.courier?.driver_name ? ` · ${order.courier.driver_name}` : ''}
                            {order.courier?.driver_phone && (
                              <a href={`tel:${order.courier.driver_phone}`} className="block text-xs font-semibold text-slate-500 hover:underline">{order.courier.driver_phone}</a>
                            )}
                          </span>
                        ) : <span className="text-sm font-semibold text-emerald-700">Delivered</span>}
                      </div>
                    </article>
                  );
                }) : <p className="text-slate-500">No orders in this view.</p>}
              </div>
            </DashboardCard>
          )}

          {active === 'Reviews' && (
            <DashboardCard title="Customer ratings">
              <div className="mt-2 flex items-center gap-3">
                <StarRating value={Math.round(score.average)} readOnly />
                <p className="text-sm text-slate-500">{score.count ? `${score.average} average from ${score.count} review${score.count === 1 ? '' : 's'}` : 'No ratings yet'}</p>
              </div>
              <div className="mt-5 space-y-4">
                {reviews.length ? reviews.map((review) => (
                  <article key={review.id} className="border-b border-slate-100 pb-4 last:border-0">
                    <StarRating value={review.stars} readOnly size="sm" />
                    <p className="mt-2 text-sm text-slate-600">{review.comment || 'Rated after purchase.'}</p>
                    <p className="mt-1 text-xs text-slate-400">{review.customerName} · {review.productName} · {review.createdAt}</p>
                    {review.reply ? (
                      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"><strong>Your reply:</strong> {review.reply}</p>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <input value={replyDrafts[review.id] || ''} onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))} placeholder="Thank the customer" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
                        <button type="button" onClick={() => sendReply(review.id)} className="rounded-lg bg-purple-700 px-3 py-2 text-sm font-semibold text-white">Reply</button>
                      </div>
                    )}
                  </article>
                )) : <p className="text-slate-500">When a customer marks an order received, their rating appears here.</p>}
              </div>
            </DashboardCard>
          )}

          {active === 'Analytics' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardCard title="Revenue" value={`K${revenue.toFixed(2)}`} detail="From local orders" />
              <DashboardCard title="Placed" value={statusCounts.placed} detail="Waiting to pack" />
              <DashboardCard title="In transit" value={statusCounts.processing + statusCounts.shipped} detail="Packing or with courier" />
              <DashboardCard title="Delivered" value={statusCounts.delivered} detail="Completed sales" />
            </div>
          )}
        </main>
      </div>

      {showForm && <ProductForm form={form} setForm={setForm} message={message} onClose={() => setShowForm(false)} onImages={handleImages} onSubmit={submitProduct} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Remove this listing?</h2>
            <p className="mt-2 text-sm text-slate-500">{confirmDelete.name} will disappear from your storefront in this browser.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={removeProduct} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
