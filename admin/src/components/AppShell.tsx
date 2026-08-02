import { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from '@/lib/router';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import { PlatformFooter } from './PlatformFooter';
import { Sidebar } from './Sidebar';

export const AppShell = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) navigate('/login', { replace: true }); }, [loading, user, navigate, location.pathname]);
  if (loading) return <div className="admin-loading"><span className="spinner" /> جارٍ فتح مساحة الإدارة...</div>;
  if (!user) return null;
  return <div className="admin-shell"><Header user={user} /><div className="admin-body"><Sidebar /><main className="admin-main"><div className="admin-frame">{children}</div><PlatformFooter /></main></div></div>;
};
