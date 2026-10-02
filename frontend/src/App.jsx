import React from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import LoginPage from './pages/LoginPage';
import SignupCustomer from './pages/SignupCustomer';
import SignupSeller from './pages/SignupSeller';
import SignupCourier from './pages/SignupCourier';
import CustomerDashboard from './pages/CustomerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import CourierDashboard from './pages/CourierDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Header from './components/Header';
import SuspendedNotice from './components/SuspendedNotice';
import Footer from './components/Footer';
import CartPage from './pages/CartPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import Products from './pages/Products';
import StoreCatalog from './pages/StoreCatalog';
import Collections from './pages/Collections';
import About from './pages/About';
import Contact from './pages/Contact';
import Policies from './pages/Policies';
import AccountProfile from './pages/AccountProfile';
import OrderTrack from './pages/OrderTrack';
import BackButton from './components/BackButton';
import { useAuth } from './context/AuthContext';
import { dashboardForRole } from './utils/authRedirect';

function MainLayout() {
  return <div className="min-h-screen flex flex-col bg-slate-50"><Header /><SuspendedNotice /><main className="flex-1"><Outlet /></main><Footer /></div>;
}

function CustomerCommerceRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading your account...</div>;
  return user && user.role !== 'customer'
    ? <Navigate to={dashboardForRole(user.role)} replace />
    : <Outlet />;
}

class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="min-h-screen bg-gray-50 p-8 text-center"><h1 className="text-2xl font-bold text-slate-900">We could not load this page</h1><p className="mt-2 text-slate-500">Refresh the page to try again.</p><button onClick={() => window.location.reload()} className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">Refresh</button></div>;
    }
    return this.props.children;
  }
}

function SignupChoice() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">Choose your account type</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <a href="/signup/customer" className="border rounded-lg p-8 shadow hover:shadow-lg transition bg-white">
          <div className="text-4xl mb-4">🛍️</div>
          <h2 className="text-xl font-bold mb-2">Customer</h2>
          <p>Shop products, track orders, and manage your cart.</p>
        </a>
        <a href="/signup/seller" className="border rounded-lg p-8 shadow hover:shadow-lg transition bg-white">
          <div className="text-4xl mb-4">🏪</div>
          <h2 className="text-xl font-bold mb-2">Seller</h2>
          <p>Manage your products, orders, and shop dashboard.</p>
        </a>
        <a href="/signup/courier" className="border rounded-lg p-8 shadow hover:shadow-lg transition bg-white">
          <div className="text-4xl mb-4">🛵</div>
          <h2 className="text-xl font-bold mb-2">Courier</h2>
          <p>Collect parcels from shops and confirm deliveries.</p>
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppErrorBoundary><Router>
      <AuthProvider>
        <CartProvider>
          <BackButton />
          <Routes>
            <Route element={<MainLayout />}>
              <Route element={<CustomerCommerceRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/products" element={<Products />} />
                <Route path="/stores/:id" element={<StoreCatalog />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders/:id" element={<OrderTrack />} />
                <Route path="/product/:id" element={<ProductDetail />} />
              </Route>
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/policies" element={<Policies />} />
            </Route>
            <Route path="/account" element={<AccountProfile />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupChoice />} />
            <Route path="/signup/customer" element={<SignupCustomer />} />
            <Route path="/signup/seller" element={<SignupSeller />} />
            <Route path="/signup/courier" element={<SignupCourier />} />
            <Route element={<ProtectedRoute role="customer" />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            </Route>
            <Route element={<ProtectedRoute role="courier" />}>
              <Route path="/courier/dashboard" element={<CourierDashboard />} />
            </Route>
            <Route element={<ProtectedRoute role="seller" />}>
              <Route path="/seller/dashboard" element={<SellerDashboard />} />
            </Route>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users/:role" element={<AdminUsers />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router></AppErrorBoundary>
  );
}

export default App;
