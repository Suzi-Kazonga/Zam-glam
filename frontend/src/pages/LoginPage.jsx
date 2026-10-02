// The sign-in page.
//
// Picking a role only changes the colours and the hint shown; the server decides what kind
// of account an email belongs to. The page also explains itself when a session has ended,
// which is how somebody arrives here holding a token the server no longer accepts.

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { dashboardForRole, getPostLoginPath } from '../utils/authRedirect';
import { LOGIN_STRATEGIES } from '../utils/loginStrategies';
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
  const strategy = LOGIN_STRATEGIES[role];

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
      const result = await strategy.authenticate({ email, password }, login);
      continueAfterLogin(result?.user);
    } catch (err) {
      setError(err?.error || err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f5f0] p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className={`px-6 py-6 text-center sm:px-8 ${roleStyles[role].header}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-white/75">Zamglam account access</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{strategy.label} sign in</h1>
          <p className="mt-2 text-sm text-white/85">{strategy.description}</p>
        </div>

        <div className="p-5 sm:p-8">
          <fieldset className="mb-6">
            <legend className="mb-2 text-sm font-semibold text-slate-700">Choose account type</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.values(LOGIN_STRATEGIES).map((option) => (
              <button
                key={option.role}
                type="button"
                aria-pressed={role === option.role}
                onClick={() => handleRoleChange(option.role)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                  role === option.role
                    ? `${roleStyles[option.role].button} border-transparent text-white`
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                }`}
              >
                <span aria-hidden="true" className="text-xl leading-none">{option.symbol}</span>
                {option.label}
              </button>
            ))}
            </div>
          </fieldset>

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
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="login-password"
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
