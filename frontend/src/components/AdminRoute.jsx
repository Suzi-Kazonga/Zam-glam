// Wraps the admin pages: anybody who is not an administrator is sent away.
//
// This is convenience, not security — the real check is on the server, which refuses the
// request whatever the browser decides to render.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-10 text-center">Loading your account...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
