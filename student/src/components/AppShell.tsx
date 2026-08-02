import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const AppShell = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  if (loading) {
    return <div className="app-loading"><span className="spinner" /> جاري تجهيز المنصة...</div>;
  }
  if (!user) return null;

  return (
    <div className="app-shell">
      <Header student={user} />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <div className="content-frame">{children}</div>
        </main>
      </div>
    </div>
  );
};
