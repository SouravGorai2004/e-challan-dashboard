import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { currentAccount } from '../../services/auth';

export default function ProtectedRoute({ roles }) {
  const location = useLocation();
  const account = currentAccount();
  if (!account) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(account.role)) return <Navigate to={account.role === 'super-admin' ? '/super-admin/dashboard' : '/dashboard'} replace />;
  return <Outlet />;
}
