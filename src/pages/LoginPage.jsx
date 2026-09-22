import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import BackButton from '../components/BackButton';
import { dashboardForRole, getPostLoginPath } from '../utils/authRedirect';
import { ROLE_THEMES } from '../utils/roleTheme';

// Colours come from the shared role theme so login, header, topbar and sidebar always match.
const roleStyles = Object.fromEntries(
  Object.entries(ROLE_THEMES).map(([role, theme]) => [role, { header: theme.bar, button: theme.button }]),
);

function LoginPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.signupEmail || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  // ?reason=… is set when the API client ends a dead session and sends the user here.
  const [error, setError] = useState(
    location.state?.signupError || new URLSearchParams(location.search).get('reason') || '',
  );
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
    navigate(dashboardForRole(user.role));
    return null;
  }

  const continueAfterLogin = (loggedInUser) => {
    navigate(getPostLoginPath(loggedInUser, from, getTotalItems()), { replace: true });
  };

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
        <div className="px-4 pt-4">
          <BackButton to="/" label="Home" />
        </div>
        <div className={`px-8 py-6 text-center ${roleStyles[role].header}`}>
          <h1 className="text-2xl font-bold text-white">{role === 'admin' ? 'Admin portal' : 'Welcome back'}</h1>
          <p className="text-indigo-100 mt-2">
            {role === 'admin' ? 'Sign in to manage Zamglam accounts' : 'Sign in to continue where you left off'}
          </p>
        </div>

        <div className="p-5 sm:p-8">
          <div className="grid grid-cols-2 gap-2 mb-6 sm:grid-cols-4">
            {['customer', 'seller', 'courier', 'admin'].map((option) => (
              <button
                key={option}
                type="button"
                className={`py-2 px-2 rounded-lg text-sm font-semibold border capitalize transition ${
                  role === option
                    ? `${option === 'seller' ? 'bg-purple-700 border-purple-700' : option === 'courier' ? 'bg-emerald-700 border-emerald-700' : option === 'admin' ? 'bg-slate-900 border-slate-900' : 'bg-indigo-600 border-indigo-600'} text-white`
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
                {/* Only the "that email is taken" case wants this advice; a session that has
                    simply ended does not. */}
                {location.state?.signupError && (
                  <p className="mt-1 text-red-500">Please log in with your existing account, or create a different one.</p>
                )}
              </div>
            )}

            {role === 'admin' && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
                Seeded admin: <strong>admin@zamglam.local</strong> / <strong>ADMIN123456</strong>
              </div>
            )}

            {role === 'customer' && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-slate-600">
                Seeded customer: <strong>customer@zamglam.local</strong> / <strong>CUSTOMER123456</strong>
              </div>
            )}

            {role === 'seller' && (
              <div className="rounded-lg bg-purple-50 border border-purple-100 px-3 py-2 text-xs text-slate-600">
                Seeded shop: <strong>mud@zamglam.local</strong> / <strong>MUD123456</strong>
              </div>
            )}

            {role === 'courier' && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-slate-600">
                Seeded courier: <strong>mwansa@zamglamcourier.local</strong> / <strong>COURIER123456</strong>
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
