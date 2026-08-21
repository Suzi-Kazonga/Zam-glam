import { useEffect, useMemo, useState } from 'react';
import DashboardCard from '../components/DashboardCard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { createProduct, deleteProduct, getSellerProducts } from '../api/productApi';
import apiClient from '../api/axios';

const sections = ['Overview', 'Products', 'Orders', 'Analytics'];

export default function SellerDashboard() {
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', image_url: '', category_id: 1, imageFile: null });

  const loadData = () => {
    getSellerProducts().then(setProducts).catch(() => setProducts([]));
    apiClient.get('/orders').then(({ data }) => setOrders(Array.isArray(data) ? data : [])).catch(() => setOrders([]));
  };
  useEffect(() => { loadData(); }, []);

  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.description || ''}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const revenue = orders.reduce((total, order) => total + Number(order.price || 0) * Number(order.quantity || 1), 0);
  const submitProduct = async (event) => {
    event.preventDefault(); setMessage('');
    try { await createProduct({ ...form, price: Number(form.price), stock: Number(form.stock), category_id: Number(form.category_id) }); setForm({ name: '', description: '', price: '', stock: '', image_url: '', category_id: 1, imageFile: null }); setMessage('Product added successfully.'); loadData(); } catch (error) { setMessage(error?.error || 'Could not add product. Check that your seller profile is set up.'); }
  };

  return <div className="flex min-h-screen bg-gray-50"><Sidebar items={sections} active={active} onSelect={setActive} role="seller" /><div className="min-w-0 flex-1"><Topbar onSearch={setQuery} /><main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"><div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Seller studio</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Run your store with clarity</h1><p className="mt-1 text-slate-500">Manage products, fulfill orders, and watch the numbers move.</p></div>
    {(active === 'Overview' || active === 'Analytics') && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><DashboardCard title="Sales" value={orders.length} detail="Orders received" /><DashboardCard title="Revenue" value={`K${revenue.toFixed(2)}`} detail="From loaded orders" /><DashboardCard title="Products" value={products.length} detail="Live listings" /><DashboardCard title="Stock" value={products.reduce((total, product) => total + Number(product.stock || 0), 0)} detail="Units available" /></div>}
    {(active === 'Overview' || active === 'Products') && <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"><DashboardCard title="Product management" className="overflow-hidden"><div className="mt-4 space-y-3">{filteredProducts.length ? filteredProducts.map((product) => <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"><div><p className="font-semibold text-slate-900">{product.name}</p><p className="text-sm text-slate-500">{product.stock} in stock · K{Number(product.price).toFixed(2)}</p></div><div className="flex gap-2"><button onClick={() => setForm({ name: product.name, description: product.description || '', price: product.price, stock: product.stock, image_url: product.image_url || '', category_id: product.category_id || 1, imageFile: null })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit</button><button onClick={async () => { await deleteProduct(product.id); loadData(); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">Delete</button></div></div>) : <p className="text-slate-500">No products match your search.</p>}</div></DashboardCard><DashboardCard title="Add new product"><form onSubmit={submitProduct} className="mt-4 space-y-3">{[['name', 'Product name', 'text'], ['description', 'Description', 'text'], ['price', 'Price (ZMW)', 'number'], ['stock', 'Stock quantity', 'number'], ['image_url', 'Image URL', 'url']].map(([key, label, type]) => <input key={key} required={['name', 'price', 'stock'].includes(key)} type={type} placeholder={label} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-300" />)}<label className="block rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">Image upload<input type="file" name="image" accept="image/*" onChange={(event) => setForm({ ...form, imageFile: event.target.files[0] })} className="mt-2 w-full text-xs" /></label>{message && <p className="text-sm text-indigo-700">{message}</p>}<button className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700">Save product</button></form></DashboardCard></div>}
    {(active === 'Overview' || active === 'Orders') && <DashboardCard title="Order management"><div className="mt-4 space-y-3">{orders.length ? orders.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3"><div><p className="font-semibold">Order #{order.id} · {order.name}</p><p className="text-sm text-slate-500">{order.quantity || 1} item(s) · K{Number(order.price || 0).toFixed(2)}</p></div><select defaultValue={order.status} onChange={async (event) => { await apiClient.patch(`/orders/${order.id}/status`, { status: event.target.value }); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>pending</option><option>processing</option><option>shipped</option><option>delivered</option></select></div>) : <p className="text-slate-500">No customer orders to display.</p>}</div></DashboardCard>}
  </main></div></div>;
}
