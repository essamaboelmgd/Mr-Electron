import { useEffect, useRef, useState } from 'react';
import { BookOpen, ClipboardList, LayoutDashboard, LogOut, Menu, Settings, SlidersHorizontal, Users, X } from 'lucide-react';
import { NavLink, useNavigate } from '@/lib/router';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const groups = [
  { label: 'الرئيسية', links: [{ label: 'نظرة عامة', path: '/dashboard', icon: LayoutDashboard }] },
  { label: 'إدارة المحتوى', links: [{ label: 'المنهج والأبواب', path: '/curriculum', icon: BookOpen }, { label: 'الامتحانات', path: '/exams/manage', icon: ClipboardList }] },
  { label: 'متابعة الطلاب', links: [{ label: 'الطلاب', path: '/students', icon: Users }, { label: 'الإعدادات', path: '/settings', icon: Settings }] }
];

const roleLabels = { admin: 'مدير المنصة', teacher: 'مدرس العلوم', assistant: 'مساعد المدرس' } as const;

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    const toggleButton = toggleRef.current;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (isMobile) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('#admin-mobile-actions a, #admin-mobile-actions button')?.focus();
      });
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      if (isMobile) toggleButton?.focus();
    };
  }, [open]);
  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login', { replace: true });
  };
  return <div ref={menuRef} className="admin-sidebar-slot">
    <button ref={toggleRef} id="admin-sidebar-toggle" className="admin-mobile-menu" type="button" onClick={() => setOpen((value) => !value)} aria-controls="admin-mobile-actions" aria-expanded={open} aria-label={open ? 'إغلاق الاختصارات' : 'فتح الاختصارات'}>{open ? <X size={21} /> : <Menu size={21} />}</button>
    <nav id="admin-mobile-actions" className={cn('admin-mobile-action-menu', open && 'is-open')} aria-label="اختصارات الإدارة" aria-hidden={!open}>
      {groups.flatMap(({ links }) => links).map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/dashboard'} onClick={() => setOpen(false)} className={({ isActive }) => cn('admin-mobile-action-item', isActive && 'is-active')}><Icon size={20} strokeWidth={1.9} aria-hidden="true" /><span className="admin-mobile-action-label">{label}</span></NavLink>)}
    </nav>
    <aside id="admin-sidebar" className={cn('admin-sidebar', open && 'is-open')} aria-label="قائمة الإدارة">
      <div className="admin-sidebar-inner">
        <div className="admin-sidebar-kicker"><SlidersHorizontal size={14} /> مساحة المدرس</div>
        <nav className="admin-nav">
          {groups.map((group) => <div className="admin-nav-group" key={group.label}>
            <span className="admin-nav-group-label">{group.label}</span>
            {group.links.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/dashboard'} onClick={() => setOpen(false)} className={({ isActive }) => cn('admin-nav-item', isActive && 'is-active')}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></NavLink>)}
          </div>)}
        </nav>
        <div className="admin-sidebar-summary"><div><strong>9</strong><small>صفوف</small></div><div><strong>يدوي</strong><small>تفعيل الطلاب</small></div></div>
        <div className="admin-sidebar-note"><strong>مساحة Mr Electron</strong><p>رتّب المحتوى، فعّل الأبواب، وتابع تقدّم طلابك من مكان واحد.</p></div>
        <div className="admin-sidebar-account">
          <div className="admin-sidebar-profile">
            <span className="admin-sidebar-avatar">{user?.name?.charAt(0) || 'م'}</span>
            <span><strong>{user?.name || 'مدرس العلوم'}</strong><small>{user?.role ? roleLabels[user.role] : 'مساحة الإدارة'}</small></span>
          </div>
          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}><LogOut size={16} /> تسجيل الخروج</button>
        </div>
      </div>
    </aside>
  </div>;
};
