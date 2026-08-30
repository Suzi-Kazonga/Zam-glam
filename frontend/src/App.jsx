import React from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import LoginPage from './pages/LoginPage';
import SignupCustomer from './pages/SignupCustomer';
import SignupSeller from './pages/SignupSeller';
import CustomerDashboard from './pages/CustomerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import CartPage from './pages/CartPage';
import AdminDashboard from './pages/AdminDashboard';
import Products from './pages/Products';
import StoreCatalog from './pages/StoreCatalog';
import About from './pages/About';
import Contact from './pages/Contact';
import Policies from './pages/Policies';
import AccountProfile from './pages/AccountProfile';
import OrderTrack from './pages/OrderTrack';

function MainLayout() {
  return <div className="min-h-screen flex flex-col bg-slate-50"><Header /><main className="flex-1"><Outlet /></main><Footer /></div>;
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
      <div className="grid md:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}

function App() {
  return (
    <AppErrorBoundary><Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/stores/:id" element={<StoreCatalog />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders/:id" element={<OrderTrack />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/policies" element={<Policies />} />
            </Route>
            <Route path="/account" element={<AccountProfile />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupChoice />} />
            <Route path="/signup/customer" element={<SignupCustomer />} />
            <Route path="/signup/seller" element={<SignupSeller />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/seller/dashboard" element={<SellerDashboard />} />
            </Route>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router></AppErrorBoundary>
  );
}

export default App;
