import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartIcon from './CartIcon';
import SearchBar from './SearchBar';
import { getStorefrontPath } from '../utils/storeLogos';

export default function Topbar({ onSearch }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isSeller = user?.role === 'seller';
  const dashboardPath = isSeller ? '/seller/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard';
  const storefront = getStorefrontPath(user?.shop_name || user?.name);

  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-white p-4 shadow">
      <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">Zamglam</Link>
      <nav className="hidden items-center gap-4 text-sm font-semibold text-slate-600 md:flex">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        {isSeller ? <Link to={storefront} className="hover:text-indigo-600">View storefront</Link> : <Link to="/products" className="hover:text-indigo-600">Shop</Link>}
        <Link to={dashboardPath} className="hover:text-indigo-600">Dashboard</Link>
      </nav>
      <div className="order-3 w-full flex-1 md:order-2 md:w-auto">
        <SearchBar placeholder={isSeller ? 'Search products and orders' : 'Search products and orders'} onSearch={onSearch} />
      </div>
      <div className="relative ml-auto flex items-center gap-2">
        {!isSeller && user?.role !== 'admin' && <CartIcon />}
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          <span className="hidden text-sm font-semibold text-slate-700 sm:block">{user?.name || 'Account'}</span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-12 z-40 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <Link to="/" className="block rounded px-3 py-2 text-sm hover:bg-slate-50">Home</Link>
            {isSeller ? <Link to={storefront} className="block rounded px-3 py-2 text-sm hover:bg-slate-50">View storefront</Link> : <Link to="/products" className="block rounded px-3 py-2 text-sm hover:bg-slate-50">Shop</Link>}
            <Link to={dashboardPath} className="block rounded px-3 py-2 text-sm hover:bg-slate-50">Dashboard</Link>
            {user?.role === 'admin' && <Link to="/admin/dashboard" className="block rounded px-3 py-2 text-sm hover:bg-slate-50">Admin dashboard</Link>}
            <button onClick={() => { logout(); navigate('/login'); }} className="w-full rounded px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">Log out</button>
          </div>
        )}
      </div>
    </header>
  );
}
