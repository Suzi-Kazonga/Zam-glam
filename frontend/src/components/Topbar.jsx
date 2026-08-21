import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartIcon from './CartIcon';
import SearchBar from './SearchBar';

export default function Topbar({ onSearch }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  return <header className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-white p-4 shadow">
    <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">Zamglam</Link>
    <div className="order-3 w-full flex-1 md:order-2 md:w-auto"><SearchBar onSearch={onSearch} /></div>
    <div className="relative ml-auto flex items-center gap-2">
      <CartIcon />
      <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span><span className="hidden text-sm font-semibold text-slate-700 sm:block">{user?.name || 'Account'}</span></button>
      {menuOpen && <div className="absolute right-0 top-12 z-40 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"><Link to="/" className="block rounded px-3 py-2 text-sm hover:bg-slate-50">Shop</Link><button onClick={() => { logout(); navigate('/login'); }} className="w-full rounded px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">Log out</button></div>}
    </div>
  </header>;
}