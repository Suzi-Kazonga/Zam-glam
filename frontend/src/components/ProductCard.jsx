import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const fallbackImage = '/images/products/mud-denim.jpg';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <article className="group overflow-hidden rounded-lg bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/product/${product.id}`} className="block overflow-hidden">
        <img 
          src={product.image_url || fallbackImage}
          alt={product.name}
          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="p-4"><p className="mb-1 text-xs uppercase tracking-wider text-slate-400">{product.audience || 'New arrival'}</p><h3 className="truncate font-semibold text-slate-900">{product.name}</h3><p className="mt-2 text-lg font-bold text-indigo-700">K{Number(product.price).toFixed(2)}</p><button onClick={handleAddToCart} disabled={product.stock === 0} className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">{product.stock === 0 ? 'Sold out' : 'Quick add'}</button></div>
    </article>
  );
};

export default ProductCard;
