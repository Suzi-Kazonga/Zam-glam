import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ADMIN_CREDENTIALS } from '../utils/adminAuth';
import { CUSTOMER_CREDENTIALS } from '../utils/customerAuth';
import { SELLER_CREDENTIALS } from '../utils/sellerAuth';
import { getPostLoginPath } from '../utils/authRedirect';

const roleStyles = {
  customer: { header: 'bg-indigo-600', button: 'bg-indigo-600 hover:bg-indigo-700' },
  seller: { header: 'bg-purple-700', button: 'bg-purple-700 hover:bg-purple-800' },
  admin: { header: 'bg-slate-900', button: 'bg-slate-900 hover:bg-slate-800' },
};

function LoginPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.signupEmail || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(location.state?.signupError || '');
  const { login, user } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const from = location.state?.from;

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setError('');
  };

  useEffect(() => {
    if (location.state?.signupEmail) {
      setEmail(location.state.signupEmail);
    }
    if (location.state?.signupError) {
      setError(location.state.signupError);
    }
  }, [location.state]);

  if (user) {
    navigate(user.role === 'seller' ? '/seller/dashboard' : '/customer/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      continueAfterLogin(result?.user);
    } catch (err) {
      setError(err?.error || err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className={`px-8 py-6 text-center ${roleStyles[role].header}`}>
          <h1 className="text-2xl font-bold text-white">{role === 'admin' ? 'Admin portal' : 'Welcome back'}</h1>
          <p className="text-indigo-100 mt-2">
            {role === 'admin' ? 'Sign in to manage Zamglam accounts' : 'Sign in to continue where you left off'}
          </p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-3 gap-2 mb-6">
            {['customer', 'seller', 'admin'].map((option) => (
              <button
                key={option}
                type="button"
                className={`py-2 px-3 rounded-lg font-semibold border capitalize transition ${
                  role === option
                    ? `${option === 'seller' ? 'bg-purple-700 border-purple-700' : option === 'admin' ? 'bg-slate-900 border-slate-900' : 'bg-indigo-600 border-indigo-600'} text-white`
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
                onClick={() => handleRoleChange(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
                <p className="font-semibold">{error}</p>
                <p className="mt-1 text-red-500">Please log in with your existing account, or create a different one.</p>
              </div>
            )}

            {role === 'admin' && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
                Demo admin: <strong>{ADMIN_CREDENTIALS.email}</strong> / <strong>{ADMIN_CREDENTIALS.password}</strong>
              </div>
            )}

            {role === 'customer' && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-slate-600">
                Demo customer: <strong>{CUSTOMER_CREDENTIALS.email}</strong> / <strong>{CUSTOMER_CREDENTIALS.password}</strong>
              </div>
            )}

            {role === 'seller' && (
              <div className="rounded-lg bg-purple-50 border border-purple-100 px-3 py-2 text-xs text-slate-600">
                Demo seller: <strong>{SELLER_CREDENTIALS.email}</strong> / <strong>{SELLER_CREDENTIALS.password}</strong>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${roleStyles[role].button}`}
            >
              {loading ? 'Signing in...' : `Sign in as ${role}`}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
            <div>
              Don’t have an account?{' '}
              <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-800">Create one here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
