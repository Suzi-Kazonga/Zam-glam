// The bar across the top of every public page: the wordmark, navigation, and whatever
// icons the signed-in role needs. On a phone the navigation folds into the ☰ button.

import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import CartIcon from './CartIcon';
import CustomerMessagesIcon from './CustomerMessagesIcon';
import HelpChatIcon from './HelpChatIcon';
import DeliveryIcon from './DeliveryIcon';
import SellerOrderIcon from './SellerOrderIcon';
import AdminApprovalsIcon from './AdminApprovalsIcon';
import { getStorefrontPath } from '../utils/storeLogos';
import { themeForRole } from '../utils/roleTheme';
import useOpenProblems from '../hooks/useOpenProblems';

const Header = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Customer shopping stays neutral white; other signed-in roles retain their
  // role colour bar.
  const theme = themeForRole(user?.role);
  // Only an administrator ever has a figure here.
  const { open: openProblems } = useOpenProblems({ chime: true });
  const themed = Boolean(user);
  const isCustomer = user?.role === 'customer';
  const shellClass = themed && !isCustomer ? `${theme.bar} border-b border-black/10` : 'border-b border-slate-200 bg-white';
  const brandClass = themed && !isCustomer ? 'text-white hover:text-white/80' : 'text-slate-900 hover:text-indigo-600';
  const navClass = themed && !isCustomer ? 'text-white/80' : 'text-slate-600';
  const linkClass = themed && !isCustomer ? 'hover:text-white transition' : 'hover:text-indigo-600 transition';
  const canBrowse = !loading && (!user || user.role === 'customer');

  // The nav is hidden below lg, so without this the links are unreachable on a phone.
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenu = useRef(null);
  const closeMenu = () => setMenuOpen(false);
  const closeAccountMenu = () => setAccountMenuOpen(false);
  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!accountMenu.current?.contains(event.target)) closeAccountMenu();
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeAccountMenu();
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountMenuOpen]);

  // One list, rendered twice: inline on desktop, stacked in the drawer on mobile.
  const navLinks = [
    ...(canBrowse ? [
      { to: '/collections', label: 'Collections' },
      { to: '/products', label: 'All Products' },
    ] : []),
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
    <header className={`relative ${shellClass}`}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:py-4 lg:flex-nowrap">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl ${isCustomer ? '' : 'lg:hidden'} ${themed && !isCustomer ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
      >
        {menuOpen ? '✕' : '☰'}
      </button>
      <Link to="/" className={`text-xl font-bold tracking-tight transition sm:text-2xl ${brandClass}`}>Zamglam</Link>
      {themed && !isCustomer && <span className="hidden rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white sm:inline">{theme.label}</span>}
      <nav className={`${isCustomer ? 'hidden' : 'hidden lg:flex'} shrink-0 gap-6 text-sm font-semibold ${navClass}`}>
        {/* No Home item: the Zamglam wordmark is the way back to the home page. */}
        {navLinks.map((link) => <Link key={link.to + link.label} to={link.to} className={linkClass}>{link.label}</Link>)}
      </nav>
      {canBrowse && (
        <div className="order-3 w-full min-w-0 flex-1 md:order-none md:mx-auto md:max-w-xl">
          <SearchBar placeholder="Search all styles" onSearch={(value) => { if (value) navigate(`/products?search=${encodeURIComponent(value)}`); }} />
        </div>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {user?.role === 'customer' && <CustomerMessagesIcon />}
        {/* Shoppers and shops message each other about an order, so the icon takes them
            to those threads. A courier has nobody to message — theirs only pointed at the
            contact page, which is of no use mid-delivery. */}
        {(user?.role === 'seller' || user?.role === 'admin' || !user) && <HelpChatIcon user={user} />}
        {canBrowse && <CartIcon />}
        {user?.role === 'courier' && <DeliveryIcon />}
        {user?.role === 'seller' && <SellerOrderIcon />}
        {user?.role === 'admin' && <AdminApprovalsIcon />}

        {user ? (
          <div className="relative" ref={accountMenu}>
            {/* Reported problems wait in the profile, so their count rides on the profile
                icon as well as on the customer service button inside it. */}
            {openProblems > 0 && (
              <span aria-label={`${openProblems} reported problem${openProblems === 1 ? '' : 's'} waiting`} className="absolute -right-1 -top-1 z-10 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                {openProblems}
              </span>
            )}
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              className={`inline-flex items-center gap-2 rounded-full border px-2 py-1.5 text-left transition ${themed && !isCustomer ? 'border-white/20 bg-white/5 text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${themed && !isCustomer ? 'bg-white/20 text-white' : 'bg-slate-900 text-white'}`}>
                {initials}
              </span>
              <span className={`hidden text-sm font-semibold sm:inline ${isCustomer ? 'text-slate-700' : 'text-white'}`}>{user.name}</span>
              <span aria-hidden="true" className={`hidden text-base sm:inline ${isCustomer ? 'text-slate-400' : 'text-white/70'}`}>▾</span>
            </button>
            {accountMenuOpen && (
              <div role="menu" aria-label="Account menu" className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-bold text-white">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{user.role || 'customer'}</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <Link to="/account" onClick={closeAccountMenu} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    <span>My Profile</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <Link to="/account#orders" onClick={closeAccountMenu} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    <span>My Orders</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <Link to={user.role === 'customer' ? '/customer/dashboard?section=Messages' : '/seller/dashboard?section=Messages'} onClick={closeAccountMenu} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    <span>My Messages</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <Link to="/policies" onClick={closeAccountMenu} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    <span>Policies & guide</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <Link to="/contact" onClick={closeAccountMenu} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    <span>Customer support</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeAccountMenu();
                      setMenuOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="mt-2 flex w-full items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                  >
                    <span>Sign Out</span>
                    <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative" ref={accountMenu}>
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              aria-label="Account options"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.25" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 20c.5-3.45 3.15-5.5 6.5-5.5s6 2.05 6.5 5.5" />
              </svg>
            </button>
            {accountMenuOpen && (
              <div role="menu" aria-label="Account options" className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xl">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Welcome to Zamglam</p>
                <Link
                  to="/login"
                  state={{ from: location }}
                  role="menuitem"
                  onClick={closeAccountMenu}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  state={{ from: location }}
                  role="menuitem"
                  onClick={closeAccountMenu}
                  className="block rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {menuOpen && (
        <nav aria-label="Customer and shopping navigation" className={`z-40 border-t px-4 pb-4 ${isCustomer ? 'absolute left-0 right-0 top-full bg-white shadow-lg' : 'lg:hidden'} ${themed && !isCustomer ? 'border-white/20' : 'border-slate-200'}`}>
          {navLinks.map((link) => (
            <Link
              key={`m-${link.to}-${link.label}`}
              to={link.to}
              onClick={closeMenu}
              className={`block border-b py-3 text-base font-semibold ${themed && !isCustomer ? 'border-white/10 text-white' : 'border-slate-100 text-slate-700'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;
