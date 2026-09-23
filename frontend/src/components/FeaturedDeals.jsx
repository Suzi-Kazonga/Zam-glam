// The home page’s offers strip.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getDeals } from '../api/dealApi';
import { useAuth } from '../context/AuthContext';
import { canShop } from '../utils/permissions';

const fallbackDeals = [
  { id: 1, name: 'Classic Denim Pants', store_name: 'Mud', price: 350, sale_price: 280, expires_at: '2026-08-31T23:59:59', image_url: '/images/products/mud-denim.jpg' },
  { id: 2, name: 'Sneakers', store_name: 'Jets', price: 500, sale_price: 400, expires_at: '2026-08-31T23:59:59', image_url: '/images/products/jets-sneakers.jpg' },
  { id: 3, name: 'Printed T-Shirt', store_name: 'Bata', price: 200, sale_price: 160, expires_at: '2026-08-31T23:59:59', image_url: '/images/products/bata-tshirt.jpg' },
];

function formatRemaining(expiry) {
  const seconds = Math.max(0, Math.floor((new Date(expiry).getTime() - Date.now()) / 1000));
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function FeaturedDeals() {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [deals, setDeals] = useState(fallbackDeals);
  const [index, setIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [, setClock] = useState(Date.now());
  useEffect(() => { getDeals().then((data) => { if (Array.isArray(data) && data.length) setDeals(data); }).catch(() => {}); }, []);
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const deal = deals[index % deals.length];
  const discount = Math.round((1 - Number(deal.sale_price) / Number(deal.price)) * 100);
  return <section className="mx-auto max-w-7xl px-4 py-12"><div className="rounded-lg border border-red-400 bg-red-100 p-4 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-red-700">Flash sale</p><h2 className="mt-1 text-3xl font-bold text-slate-900">Featured Local Deals</h2></div><p className="font-mono text-xl font-bold text-red-700">Ends in {formatRemaining(deal.expires_at)}</p></div><div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div className="flex items-center gap-5"><Link to={`/product/${deal.product_id || deal.id}`} className="shrink-0"><img src={deal.image_url} alt={deal.name} className="h-32 w-28 rounded-lg object-cover sm:h-40 sm:w-36" /></Link><div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">{deal.store_name}</p><h3 className="mt-2 text-2xl font-bold text-slate-900">{deal.name}</h3><div className="mt-3 flex items-center gap-3"><span className="text-2xl font-bold text-red-700">K{Number(deal.sale_price).toFixed(0)}</span><span className="text-slate-500 line-through">K{Number(deal.price).toFixed(0)}</span><span className="rounded bg-red-700 px-2 py-1 text-xs font-bold text-white">-{discount}%</span></div></div></div>{canShop(user)
  ? <button onClick={() => { addToCart({ ...deal, id: deal.product_id || deal.id, price: deal.sale_price, sellerName: deal.store_name, store_name: deal.store_name }); setAdded(true); window.setTimeout(() => setAdded(false), 1600); }} className={`rounded-lg px-6 py-3 font-bold text-white ${added ? 'bg-emerald-600' : 'bg-red-600 hover:bg-red-700'}`}>{added ? 'Added to cart' : 'Add to Cart'}</button>
  : <Link to={`/product/${deal.product_id || deal.id}`} className="rounded-lg border border-red-600 px-6 py-3 font-bold text-red-700 hover:bg-red-50">View details</Link>}</div><div className="mt-6 flex justify-center gap-2">{deals.map((item, dealIndex) => <button key={item.id} aria-label={`Show deal ${dealIndex + 1}`} onClick={() => setIndex(dealIndex)} className={`h-2 rounded-full ${dealIndex === index ? 'w-8 bg-red-700' : 'w-2 bg-red-300'}`} />)}</div></div></section>;
}