import { Navigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user)  return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'superadmin') return <Navigate to="/superadmin" />;
    if (user.role === 'admin')      return <Navigate to="/dashboard" />;
    return <Navigate to="/chat" />;
  }
  return children;
}