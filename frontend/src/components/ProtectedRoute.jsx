// Wraps pages that need somebody signed in, sending anyone else to the sign-in page.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardForRole } from '../utils/authRedirect';

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-10 text-center">Loading your account...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to={dashboardForRole(user.role)} replace />;
  return <Outlet />;
}
