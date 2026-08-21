import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

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
      const targetRoute = result?.user?.role === 'seller' ? '/seller/dashboard' : '/customer/dashboard';
      navigate(targetRoute);
    } catch (err) {
      setError(err?.error || err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className={`px-8 py-6 text-center ${role === 'seller' ? 'bg-purple-700' : 'bg-indigo-600'}`}>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-indigo-100 mt-2">Sign in to your Zamglam account</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className={`py-2 px-4 rounded-lg font-semibold border transition ${
                role === 'customer'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
              onClick={() => setRole('customer')}
            >
              Customer
            </button>
            <button
              type="button"
              className={`py-2 px-4 rounded-lg font-semibold border transition ${
                role === 'seller'
                  ? 'bg-purple-700 text-white border-purple-700'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
              onClick={() => setRole('seller')}
            >
              Seller
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
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
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                role === 'seller' ? 'bg-purple-700 hover:bg-purple-800' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Signing in...' : `Sign in as ${role}`}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don’t have an account?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-800">
              Create one here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
