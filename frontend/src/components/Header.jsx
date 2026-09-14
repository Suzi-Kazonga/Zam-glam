import React from 'react';
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

  return (
    <header className={shellClass}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4">
      <Link to="/" className={`text-2xl font-bold tracking-tight transition ${brandClass}`}>Zamglam</Link>
      {themed && <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">{theme.label}</span>}
      <nav className={`hidden gap-8 text-sm font-semibold lg:flex ${navClass}`}>
        {/* No Home item: the Zamglam wordmark is the way back to the home page. */}
        <Link to="/collections" className={linkClass}>Collections</Link>
        <Link to="/products" className={linkClass}>All Products</Link>
        {user?.role === 'customer' && <Link to="/customer/dashboard" className={linkClass}>Dashboard</Link>}
        {user?.role === 'seller' && <><Link to="/seller/dashboard" className={linkClass}>Seller Dashboard</Link><Link to={getStorefrontPath(user.shop_name || user.name)} className={linkClass}>View store</Link></>}
        {user?.role === 'courier' && <Link to="/courier/dashboard" className={linkClass}>My Deliveries</Link>}
        {user?.role === 'admin' && <><Link to="/admin/dashboard" className={linkClass}>Admin</Link><Link to="/admin/users/sellers" className={linkClass}>Shops</Link><Link to="/admin/users/customers" className={linkClass}>Customers</Link><Link to="/admin/users/couriers" className={linkClass}>Couriers</Link></>}
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
    </header>
  );
};

export default Header;
