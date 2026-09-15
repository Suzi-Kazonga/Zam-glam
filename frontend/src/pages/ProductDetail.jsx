// One product: its photos, sizes, price and the shop selling it.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import apiClient from '../api/axios';
import StarRating from '../components/StarRating';
import { findShopProduct } from '../utils/shopCatalog';
import { getSellerReviews } from '../api/reviewApi';
import { useAuth } from '../context/AuthContext';
import { canShop, NO_SHOPPING_MESSAGE } from '../utils/permissions';

const fallbackImage = '/images/products/mud-shirt.jpg';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const shopping = canShop(user);
  const [product, setProduct] = useState(() => findShopProduct(id));
  const [image, setImage] = useState('');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const localProduct = findShopProduct(id);
    if (localProduct) {
      setProduct(localProduct);
      setImage(localProduct.image_url || localProduct.images?.[0] || fallbackImage);
    }
    apiClient.get(`/products/${id}`).then(({ data }) => {
      setProduct(data);
      setImage(data.image_url || data.images?.[0] || fallbackImage);
    }).catch(() => {
      if (!localProduct) setProduct(false);
    });
  }, [id]);

  if (product === null) return <div className="mx-auto max-w-7xl px-4 py-20 text-center">Loading product...</div>;
  if (!product) return <div className="mx-auto max-w-7xl px-4 py-20 text-center">Product not found.</div>;

  const gallery = (product.images?.length ? product.images : [product.image_url || fallbackImage]).filter(Boolean);
  const sellerName = product.store_name || product.sellerName;
  // The shop's score rides along on the product; its reviews are fetched by seller id.
  const score = { average: Number(product?.store_rating || 0), count: Number(product?.store_rating_count || 0) };
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const sellerId = product?.store_seller_id;
    if (!sellerId) return;
    getSellerReviews(sellerId).then((data) => setReviews(data.reviews || [])).catch(() => setReviews([]));
  }, [product?.store_seller_id]);

  const handleAdd = () => {
    addToCart({ ...product, selectedSize: size, selectedColor: color, sellerName, store_name: sellerName }, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-lg bg-slate-100">
            <img src={image || fallbackImage} alt={product.name} className="h-[520px] w-full object-cover transition duration-300 hover:scale-105" />
          </div>
          <div className="mt-4 flex gap-3">
            {gallery.map((src) => (
              <button key={src} onClick={() => setImage(src)} className={`h-20 w-16 overflow-hidden rounded border-2 ${image === src ? 'border-indigo-600' : 'border-slate-200'}`}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="py-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">{sellerName || 'Zamglam edit'}</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">{product.name}</h1>
          {score.count > 0 && (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <StarRating value={Math.round(score.average)} readOnly size="sm" />
              {score.average} from {score.count} seller review{score.count === 1 ? '' : 's'}
            </p>
          )}
          <p className="mt-4 text-2xl font-bold text-indigo-700">K{Number(product.price).toFixed(2)}</p>
          <p className="mt-6 leading-7 text-slate-600">{product.description || 'A versatile Zamglam piece made for everyday styling.'}</p>
          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold text-slate-700">Size</p>
            <div className="flex gap-2">{['S', 'M', 'L', 'XL'].map((option) => <button key={option} onClick={() => setSize(option)} className={`rounded-lg border px-4 py-2 ${size === option ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200'}`}>{option}</button>)}</div>
          </div>
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-slate-700">Color: {color}</p>
            <div className="flex gap-3">
              <button onClick={() => setColor('Black')} aria-label="Black" className="h-8 w-8 rounded-full border-2 border-indigo-600 bg-slate-900" />
              <button onClick={() => setColor('Stone')} aria-label="Stone" className="h-8 w-8 rounded-full border-2 border-white bg-stone-300 shadow" />
            </div>
          </div>
          {shopping && (
            <label className="mt-6 block text-sm font-semibold text-slate-700">Quantity
              <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} className="mt-2 w-24 rounded-lg border border-slate-200 px-3 py-2" />
            </label>
          )}
          {shopping ? (
            <button onClick={handleAdd} disabled={product.stock === 0} className={`mt-10 w-full rounded-lg py-4 text-lg font-bold text-white ${added ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:bg-slate-300`}>
              {product.stock === 0 ? 'Sold out' : added ? 'Added to cart' : 'Add to cart'}
            </button>
          ) : (
            <p className="mt-10 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{NO_SHOPPING_MESSAGE}</p>
          )}
          <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">Seller reviews</h2>
            {reviews.length ? reviews.slice(0, 4).map((review) => (
              <article key={review.id} className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                <p className="mt-2 text-sm text-slate-600">{review.comment || 'Rated after purchase.'}</p>
                <p className="mt-2 text-xs text-slate-400">{review.customer_name || 'Zamglam shopper'} · {new Date(review.created_at).toLocaleDateString()}</p>
                {review.reply && <p className="mt-3 text-sm text-slate-500"><strong>Seller:</strong> {review.reply}</p>}
              </article>
            )) : (
              <p className="mt-3 text-sm text-slate-500">No seller ratings yet. Buy from this shop to leave the first review.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
