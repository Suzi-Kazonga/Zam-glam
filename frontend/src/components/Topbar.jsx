import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartIcon from './CartIcon';
import DeliveryIcon from './DeliveryIcon';
import SellerOrderIcon from './SellerOrderIcon';
import SearchBar from './SearchBar';
import { themeForRole } from '../utils/roleTheme';

export default function Topbar({ onSearch }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const theme = themeForRole(user?.role);

  return <header className={`flex flex-wrap items-center gap-4 p-4 shadow ${theme.bar}`}>
    <Link to="/" className="text-xl font-bold tracking-tight text-white transition hover:text-white/80">Zamglam</Link>
    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">{theme.label}</span>
    <div className="relative ml-auto flex items-center gap-2">
      {user?.role === 'customer' && <CartIcon />}
      {user?.role === 'courier' && <DeliveryIcon />}
      {user?.role === 'seller' && <SellerOrderIcon />}
      <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-white/10"><span className={`flex h-9 w-9 items-center justify-center rounded-full font-bold ${theme.avatar}`}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span><span className="hidden text-sm font-semibold text-white sm:block">{user?.name || 'Account'}</span></button>
      {menuOpen && <div className="absolute right-0 top-12 z-40 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"><Link to="/products" className="block rounded px-3 py-2 text-sm hover:bg-slate-50">Shop</Link><Link to="/account" className="block rounded px-3 py-2 text-sm hover:bg-slate-50">Profile</Link><button onClick={() => { logout(); navigate('/login'); }} className="w-full rounded px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">Log out</button></div>}
    </div>
    <div className="order-3 w-full flex-1 md:order-2 md:w-auto"><SearchBar onSearch={onSearch} /></div>
  </header>;
}
