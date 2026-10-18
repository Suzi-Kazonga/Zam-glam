// The bar across the top of every dashboard: the wordmark, search, the notification
// icons for that role, and the account menu.

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartIcon from './CartIcon';
import CustomerMessagesIcon from './CustomerMessagesIcon';
import CustomerUpdatesIcon from './CustomerUpdatesIcon';
import HelpChatIcon from './HelpChatIcon';
import DeliveryIcon from './DeliveryIcon';
import SellerOrderIcon from './SellerOrderIcon';
import AdminApprovalsIcon from './AdminApprovalsIcon';
import SearchBar from './SearchBar';
import ReportProblemButton from './ReportProblemButton';
import { themeForRole } from '../utils/roleTheme';
import useOpenProblems from '../hooks/useOpenProblems';

const navigationGroups = [
  { title: 'Manage your shop', items: ['Overview', 'Products', 'Orders', 'Messages', 'Refunds'] },
  { title: 'Grow your shop', items: ['Analytics', 'Promotions'] },
  { title: 'Store settings', items: ['Store profile', 'Notifications', 'Reviews', 'Verification'] },
];

export default function Topbar({ onSearch, navigationItems, activeNavigation, onNavigationSelect }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navigate = useNavigate();
  const theme = themeForRole(user?.role);
  // Only an administrator ever has a figure here.
  const { open: openProblems } = useOpenProblems({ chime: false });
  const isCustomer = user?.role === 'customer';
  const hasDashboardMenu = Array.isArray(navigationItems) && typeof onNavigationSelect === 'function';
  const lightHeader = isCustomer || (user?.role === 'seller' && hasDashboardMenu);
  const headerRef = useRef(null);
  const searchPlaceholder = user?.role === 'admin'
    ? 'Search accounts'
    : user?.role === 'courier'
      ? 'Search deliveries'
      : 'Search products and orders';

  useEffect(() => {
    if (!navigationOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setNavigationOpen(false); };
    const closeOnOutsideClick = (event) => {
      if (!headerRef.current?.contains(event.target)) setNavigationOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [navigationOpen]);

  return <header ref={headerRef} className={`relative flex flex-wrap items-center gap-3 border-b p-4 shadow-sm sm:gap-4 ${lightHeader ? 'border-slate-200 bg-white' : `border-black/10 ${theme.bar}`}`}>
    {hasDashboardMenu && <button
      type="button"
      onClick={() => setNavigationOpen((open) => !open)}
      aria-label={navigationOpen ? 'Close seller navigation' : 'Open seller navigation'}
      aria-expanded={navigationOpen}
      aria-controls="seller-dashboard-navigation"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-2xl text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
    >
      <span aria-hidden="true">{navigationOpen ? '×' : '☰'}</span>
    </button>}
    <Link to="/" className={`shrink-0 text-xl font-bold tracking-tight transition ${lightHeader ? 'text-slate-900 hover:text-indigo-600' : 'text-white hover:text-white/80'}`}>Zamglam</Link>
    {!lightHeader && <span className="hidden rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white sm:inline">{theme.label}</span>}
    <div className="order-3 w-full min-w-0 md:order-none md:mx-auto md:max-w-xl md:flex-1">
      <SearchBar placeholder={searchPlaceholder} onSearch={onSearch} />
    </div>
    <div className="relative ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
      {user?.role === 'customer' && <CartIcon />}
      {/* Shoppers and shops message each other about an order. A courier has nobody on the
          platform to message — theirs only pointed at the contact page, which is no use
          mid-delivery — so they get the parcel icon below and nothing else. */}
      {user?.role === 'customer' && <CustomerUpdatesIcon />}
        {user?.role === 'customer' && <CustomerMessagesIcon />}
      {(user?.role === 'seller' || user?.role === 'admin') && <HelpChatIcon user={user} neutral={lightHeader} />}
      {user?.role === 'courier' && <DeliveryIcon />}
      {user?.role === 'seller' && <SellerOrderIcon neutral={lightHeader} />}
      {user?.role === 'admin' && <AdminApprovalsIcon />}
      {/* Reported problems wait in the profile, so the count rides on the profile icon. */}
      {openProblems > 0 && (
        <span aria-label={`${openProblems} reported problem${openProblems === 1 ? '' : 's'} waiting`} className="absolute -top-1 right-8 z-10 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
          {openProblems}
        </span>
      )}
      <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Open account menu" aria-expanded={menuOpen} className={`flex items-center gap-2 rounded-lg p-1 transition ${lightHeader ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}><span title="View profile" className={`flex h-9 w-9 items-center justify-center rounded-full font-bold ${theme.avatar}`}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span><span className={`hidden text-sm font-semibold sm:block ${lightHeader ? 'text-slate-700' : 'text-white'}`}>{user?.name || 'Account'}</span></button>
      {menuOpen && <div className="absolute right-0 top-12 z-40 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
        {user?.role === 'customer' && <Link to="/products" onClick={() => setMenuOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-slate-50">Shop</Link>}
        <Link to="/account" onClick={() => setMenuOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-slate-50">Profile</Link>
        <button type="button" onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }} className="w-full rounded px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">Log out</button>
      </div>}
    </div>
    {hasDashboardMenu && navigationOpen && <nav id="seller-dashboard-navigation" aria-label="Seller dashboard navigation" className="absolute left-4 top-full z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-xl">
      {navigationGroups.map((group) => {
        const items = group.items.filter((item) => navigationItems.includes(item));
        if (!items.length) return null;
        return <div key={group.title} className="mb-3 last:mb-0">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">{group.title}</p>
          {items.map((item) => <button key={item} type="button" onClick={() => { onNavigationSelect(item); setNavigationOpen(false); }} aria-current={activeNavigation === item ? 'page' : undefined} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeNavigation === item ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'}`}>{item}</button>)}
        </div>;
      })}
      {/* Last in the shop's menu, as it is in every other role's. */}
      <div className="border-t border-slate-200 pt-2">
        <ReportProblemButton />
      </div>
    </nav>}
  </header>;
}
