import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Home, LogOut, Settings } from 'lucide-react';
import { useNavigate } from '@/lib/router';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/services/authService';

const landingUrl = (import.meta.env.VITE_LANDING_URL || 'http://localhost:5173').replace(/\/+$/, '');

export const Header = ({ user }: { user: User }) => {
  const navigate = useNavigate(); const { logout } = useAuth(); const [open, setOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => { if (!profileRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown); };
  }, [open]);
  const signOut = () => { logout(); navigate('/login', { replace: true }); };
  return <header className="admin-topbar"><div className="admin-topbar-inner"><button className="admin-brand" type="button" onClick={() => navigate('/dashboard')}><span className="admin-brand-mark"><span /><span /><span /></span><span><b>mr electron</b><small>إدارة المنصة</small></span></button><div className="admin-top-actions"><span className="admin-role">{user.role === 'teacher' ? 'مدرس' : 'إدارة'}</span><div ref={profileRef} className="admin-profile-wrap"><button className="admin-profile" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-controls="admin-profile-menu"><span>{user.name.charAt(0)}</span><ChevronDown size={15} /></button>{open && <div id="admin-profile-menu" className="admin-profile-menu" role="menu"><a role="menuitem" className="admin-profile-link" href={landingUrl}><Home size={15} /> الصفحة التعريفية</a><button role="menuitem" type="button" onClick={() => { setOpen(false); navigate('/settings'); }}><Settings size={15} /> الإعدادات</button><button role="menuitem" type="button" className="danger-action" onClick={signOut}><LogOut size={15} /> تسجيل الخروج</button></div>}</div></div></div></header>;
};
