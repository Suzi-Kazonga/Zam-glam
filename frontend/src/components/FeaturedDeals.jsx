// The home page's offers carousel.

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
  const dealIndex = deals.length ? index % deals.length : 0;
  const deal = deals[dealIndex];

  useEffect(() => {
    getDeals()
      .then((data) => {
        if (Array.isArray(data) && data.length) setDeals(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (deals.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % deals.length), 7000);
    return () => window.clearInterval(timer);
  }, [deals.length]);

  if (!deal) return null;

  const discount = Math.round((1 - Number(deal.sale_price) / Number(deal.price)) * 100);
  const productId = deal.product_id || deal.id;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-rose-700">Limited-time offers</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">Featured Local Deals</h2>
          </div>
          <p className="rounded-full bg-white/80 px-4 py-2 font-mono text-sm font-bold text-rose-700 shadow-sm">
            Ends in {formatRemaining(deal.expires_at)}
          </p>
        </div>

        <div key={deal.id} className="deal-slide-enter mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex min-w-0 items-center gap-5">
            <Link to={`/product/${productId}`} className="shrink-0">
              <img src={deal.image_url} alt={deal.name} className="h-32 w-28 rounded-xl object-cover shadow-sm sm:h-40 sm:w-36" />
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">{deal.store_name}</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{deal.name}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-2xl font-bold text-rose-700">K{Number(deal.sale_price).toFixed(0)}</span>
                <span className="text-slate-500 line-through">K{Number(deal.price).toFixed(0)}</span>
                <span className="rounded-full bg-rose-700 px-3 py-1 text-xs font-bold text-white">-{discount}%</span>
              </div>
            </div>
          </div>
          {canShop(user) ? (
            <button
              type="button"
              onClick={() => {
                addToCart({ ...deal, id: productId, price: deal.sale_price, sellerName: deal.store_name, store_name: deal.store_name });
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1600);
              }}
              className={`rounded-lg px-6 py-3 font-bold text-white ${added ? 'bg-emerald-600' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
              {added ? 'Added to cart' : 'Add to cart'}
            </button>
          ) : (
            <Link to={`/product/${productId}`} className="rounded-lg border border-rose-600 px-6 py-3 text-center font-bold text-rose-700 hover:bg-rose-50">
              View details
            </Link>
          )}
        </div>

        {deals.length > 1 && (
          <div className="mt-6 flex justify-center gap-2" aria-label="Promotion slides">
            {deals.map((item, dealDot) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show deal ${dealDot + 1}`}
                aria-pressed={dealDot === dealIndex}
                onClick={() => setIndex(dealDot)}
                className={`h-2 rounded-full transition-all duration-300 ${dealDot === dealIndex ? 'w-8 bg-rose-700' : 'w-2 bg-rose-300 hover:bg-rose-500'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
