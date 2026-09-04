import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatZmwPrice } from '../utils/currency';
import { getSellerScore } from '../utils/ratingStore';
import { getProductClickCount, recordProductClick } from '../utils/productStore';

const fallbackImage = '/images/products/mud-denim.jpg';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const sellerName = product.store_name || product.sellerName;
  const score = getSellerScore(sellerName);
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
        <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">{sellerName || product.audience || 'New arrival'}</p>
        <h3 className="truncate font-semibold text-slate-900">{product.name}</h3>
        {score.count > 0 && <p className="mt-1 text-xs text-amber-500">★ {score.average} · {score.count} seller rating{score.count === 1 ? '' : 's'}</p>}
        <p className="mt-2 text-lg font-bold text-indigo-700">{formatZmwPrice(product.price)}</p>
        <p className="mt-2 text-xs text-slate-500">Same-day delivery in Lusaka | 24-48 hrs intercity</p>
        <button onClick={handleAddToCart} disabled={product.stock === 0 || product.unavailable} className={`mt-4 w-full rounded-lg px-4 py-2 font-semibold text-white ${added ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:cursor-not-allowed disabled:bg-slate-300`}>
          {product.unavailable ? 'Sample only' : product.stock === 0 ? 'Sold out' : added ? 'Added to cart' : 'Add to cart'}
        </button>
        {product.unavailable && <p className="mt-2 text-center text-xs text-slate-400">Demo item — not available to order</p>}
      </div>
    </article>
  );
};

export default ProductCard;
