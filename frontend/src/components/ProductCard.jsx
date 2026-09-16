import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatZmwPrice } from '../utils/currency';
import { getProductClickCount, recordProductClick } from '../utils/productStore';
import { useAuth } from '../context/AuthContext';
import { canShop } from '../utils/permissions';

const fallbackImage = '/images/products/mud-denim.jpg';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const shopping = canShop(user);
  const [added, setAdded] = useState(false);
  const sellerName = product.store_name || product.sellerName;
  // The shop's real score, carried on the product from the API.
  const score = { average: Number(product.store_rating || 0), count: Number(product.store_rating_count || 0) };
  const clickCount = getProductClickCount(product.id);

  const handleAddToCart = () => {
    addToCart({ ...product, sellerName, store_name: sellerName });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="group overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/product/${product.id}`} onClick={() => recordProductClick(product.id)} className="block overflow-hidden">
        <div className="relative">
          <img
            src={product.image_url || product.images?.[0] || fallbackImage}
            alt={product.name}
            className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">{product.stock === 0 ? 'Sold out' : Number(product.stock) < 5 ? 'Low Stock' : clickCount > 0 ? 'Trending' : 'New arrival'}</span>
        </div>
      </Link>
      <div className="p-4">
        <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-slate-400">
          {sellerName || product.audience || 'New arrival'}
          {/* A suspended shop takes the place of the badge entirely: whether its papers
              were once checked is beside the point while it cannot trade. */}
          {product.store_status === 'suspended' ? (
            <span title="This shop is suspended and cannot take orders" className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold normal-case text-rose-800">Unavailable</span>
          ) : product.store_verification === 'verified' && (
            <span title="Verified shop" className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold normal-case text-emerald-800">✓ Verified</span>
          )}
        </p>
        <h3 className="truncate font-semibold text-slate-900">{product.name}</h3>
        {score.count > 0 && <p className="mt-1 text-xs text-amber-500">★ {score.average} · {score.count} seller rating{score.count === 1 ? '' : 's'}</p>}
        <p className="mt-2 text-lg font-bold text-indigo-700">{formatZmwPrice(product.price)}</p>
        <p className={`mt-2 text-sm font-semibold ${Number(product.stock) < 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
          {Number(product.stock) > 0 ? `${product.stock} in stock` : 'Sold out'}
        </p>
        <p className="mt-2 text-xs text-slate-500">Same-day delivery in Lusaka | 24-48 hrs intercity</p>
        {shopping ? (
          <button onClick={handleAddToCart} disabled={product.stock === 0 || product.unavailable} className={`mt-4 w-full rounded-lg px-4 py-2 font-semibold text-white ${added ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:cursor-not-allowed disabled:bg-slate-300`}>
            {product.stock === 0 ? 'Sold out' : added ? 'Added to cart' : 'Add to cart'}
          </button>
        ) : (
          <Link to={`/product/${product.id}`} className="mt-4 block w-full rounded-lg border border-slate-300 px-4 py-2 text-center font-semibold text-slate-700 hover:border-indigo-600 hover:text-indigo-600">
            View details
          </Link>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
