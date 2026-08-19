import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import CartIcon from './CartIcon';
import DeliveryIcon from './DeliveryIcon';
import SellerOrderIcon from './SellerOrderIcon';
import AdminApprovalsIcon from './AdminApprovalsIcon';
import { getStorefrontPath } from '../utils/storeLogos';
import { themeForRole } from '../utils/roleTheme';

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Signed-in visitors get their role's colour bar (matching their login page and
  // dashboard); signed-out browsing stays neutral white.
  const theme = themeForRole(user?.role);
  const themed = Boolean(user);
  const shellClass = themed ? `${theme.bar} border-b border-black/10` : 'border-b border-slate-200 bg-white';
  const brandClass = themed ? 'text-white hover:text-white/80' : 'text-slate-900 hover:text-indigo-600';
  const navClass = themed ? 'text-white/80' : 'text-slate-600';
  const linkClass = themed ? 'hover:text-white transition' : 'hover:text-indigo-600 transition';

  // The nav is hidden below lg, so without this the links are unreachable on a phone.
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // One list, rendered twice: inline on desktop, stacked in the drawer on mobile.
  const navLinks = [
    { to: '/collections', label: 'Collections' },
    { to: '/products', label: 'All Products' },
    ...(user?.role === 'customer' ? [{ to: '/customer/dashboard', label: 'Dashboard' }] : []),
    ...(user?.role === 'seller' ? [
      { to: '/seller/dashboard', label: 'Seller Dashboard' },
      { to: getStorefrontPath(user.shop_name || user.name), label: 'View store' },
    ] : []),
    ...(user?.role === 'courier' ? [{ to: '/courier/dashboard', label: 'My Deliveries' }] : []),
    ...(user?.role === 'admin' ? [
      { to: '/admin/dashboard', label: 'Admin' },
      { to: '/admin/users/sellers', label: 'Shops' },
      { to: '/admin/users/customers', label: 'Customers' },
      { to: '/admin/users/couriers', label: 'Couriers' },
    ] : []),
  ];

  return (
    <header className={shellClass}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:py-4">
      {/* Hamburger: only below lg, where the inline nav is hidden. */}
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-label="Menu"
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl lg:hidden ${themed ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
      >
        {menuOpen ? '✕' : '☰'}
      </button>
      <Link to="/" className={`text-xl font-bold tracking-tight transition sm:text-2xl ${brandClass}`}>Zamglam</Link>
      {themed && <span className="hidden rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white sm:inline">{theme.label}</span>}
      <nav className={`hidden gap-8 text-sm font-semibold lg:flex ${navClass}`}>
        {/* No Home item: the Zamglam wordmark is the way back to the home page. */}
        {navLinks.map((link) => <Link key={link.to + link.label} to={link.to} className={linkClass}>{link.label}</Link>)}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        {user?.role !== 'admin' && user?.role !== 'seller' && user?.role !== 'courier' && <CartIcon />}
        {user?.role === 'courier' && <DeliveryIcon />}
        {user?.role === 'seller' && <SellerOrderIcon />}
        {user?.role === 'admin' && <AdminApprovalsIcon />}

        {user ? (
          <div className="flex items-center gap-3">
            <Link to="/account" className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition hover:opacity-90 ${theme.avatar}`} title="View profile">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </Link>
            <span className="hidden text-sm font-semibold text-white sm:inline">{user.name}</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" state={{ from: location }}>
              Login
            </Link>
            <Link to="/signup" state={{ from: location }}>
              Sign Up
            </Link>
          </div>
        )}
      </div>
      <div className="order-3 w-full flex-1 md:order-2 md:w-auto"><SearchBar placeholder="Search all styles" onSearch={(value) => { if (value) navigate(`/products?search=${encodeURIComponent(value)}`); }} /></div>
      </div>

      {/* Mobile drawer: the same links, stacked, with targets big enough to tap. */}
      {menuOpen && (
        <nav className={`border-t px-4 pb-4 lg:hidden ${themed ? 'border-white/20' : 'border-slate-200'}`}>
          {navLinks.map((link) => (
            <Link
              key={`m-${link.to}-${link.label}`}
              to={link.to}
              onClick={closeMenu}
              className={`block border-b py-3 text-base font-semibold ${themed ? 'border-white/10 text-white' : 'border-slate-100 text-slate-700'}`}
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <div className="mt-3 flex gap-2">
              <Link to="/login" state={{ from: location }} onClick={closeMenu} className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700">Login</Link>
              <Link to="/signup" state={{ from: location }} onClick={closeMenu} className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-center font-semibold text-white">Sign Up</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;
