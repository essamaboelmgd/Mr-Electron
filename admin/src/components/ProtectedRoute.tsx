import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAuthenticated } from '@/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !['admin', 'teacher', 'assistant'].includes(user.role)) {
      navigate('/login', { replace: true });
    } else if (!loading && !user && isAuthenticated()) {
      // User has a token but no user data, which means authentication failed
      // Redirect to login to force re-authentication
      navigate('/login', { replace: true });
    } else if (!loading && !user && !isAuthenticated()) {
      // No token and no user data, redirect to login
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  // Only render children if we have a user
  return user && ['admin', 'teacher', 'assistant'].includes(user.role) ? <>{children}</> : null;
};

export default ProtectedRoute;
