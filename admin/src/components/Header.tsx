import { useState } from 'react';
import { ChevronDown, Home, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/services/authService';

const landingUrl = (import.meta.env.VITE_LANDING_URL || 'http://localhost:5173').replace(/\/+$/, '');

export const Header = ({ user }: { user: User }) => {
  const navigate = useNavigate(); const { logout } = useAuth(); const [open, setOpen] = useState(false);
  const signOut = () => { logout(); navigate('/login', { replace: true }); };
  return <header className="admin-topbar"><div className="admin-topbar-inner"><button className="admin-brand" type="button" onClick={() => navigate('/dashboard')}><span className="admin-brand-mark"><span /><span /><span /></span><span><b>mr electron</b><small>إدارة المنصة</small></span></button><div className="admin-top-actions"><span className="admin-role">{user.role === 'teacher' ? 'مدرس' : 'إدارة'}</span><div className="admin-profile-wrap"><button className="admin-profile" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}><span>{user.name.charAt(0)}</span><ChevronDown size={15} /></button>{open && <div className="admin-profile-menu"><a className="admin-profile-link" href={landingUrl}><Home size={15} /> الصفحة التعريفية</a><button type="button" onClick={() => { setOpen(false); navigate('/settings'); }}><Settings size={15} /> الإعدادات</button><button type="button" className="danger-action" onClick={signOut}><LogOut size={15} /> تسجيل الخروج</button></div>}</div></div></div></header>;
};
