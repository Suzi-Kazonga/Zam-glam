import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import SearchBar from './SearchBar';
import CartIcon from './CartIcon';
import { getStorefrontPath } from '../utils/storeLogos';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4">
      <Link to="/" className="text-2xl font-bold tracking-tight text-slate-900 transition hover:text-indigo-600">Zamglam</Link>
      <nav className="hidden gap-5 text-sm font-semibold text-slate-600 lg:flex"><Link to="/">Home</Link><Link to="/products">Shop</Link>
        {user?.role === 'customer' && <Link to="/customer/dashboard">Dashboard</Link>}
        {user?.role === 'seller' && <><Link to="/seller/dashboard">Seller Dashboard</Link><Link to={getStorefrontPath(user.shop_name || user.name)}>View store</Link></>}
        {user?.role === 'admin' && <Link to="/admin/dashboard">Admin</Link>}
      </nav>
      <div className="order-3 w-full flex-1 md:order-2 md:w-auto"><SearchBar placeholder="Search all styles" onSearch={(value) => { if (value) navigate(`/products?search=${encodeURIComponent(value)}`); }} /></div>
      <div className="ml-auto flex items-center gap-3">
        {user?.role !== 'admin' && user?.role !== 'seller' && <CartIcon />}

        {user ? (
          <div className="flex items-center gap-3">
            <Link to="/account" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 transition hover:bg-indigo-200" title="View profile">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </Link>
            <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" state={{ from: location }}>
              <Button variant="primary" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/signup" state={{ from: location }}>
              <Button variant="secondary" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div></div>
    </header>
  );
};

export default Header;
