// The basket in the header, with a count of what is in it.

import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartIcon() {
  const { getTotalItems } = useCart();
  const count = getTotalItems();
  return <Link to="/cart" aria-label={`Cart with ${count} items`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-slate-100">
    🛒
    {count > 0 && <span className="absolute right-0 top-0 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{count}</span>}
  </Link>;
}