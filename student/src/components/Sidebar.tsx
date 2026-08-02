import { useEffect, useRef, useState } from 'react';
import { BookOpen, ClipboardList, LayoutDashboard, LogOut, Menu, Settings, Target, UserRound, X } from 'lucide-react';
import { NavLink, useNavigate } from '@/lib/router';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const groups = [
  { label: 'ابدأ من هنا', links: [{ label: 'الرئيسية', path: '/dashboard', icon: LayoutDashboard }] },
  { label: 'التعلّم', links: [{ label: 'المنهج', path: '/courses', icon: BookOpen }, { label: 'الامتحانات', path: '/exams', icon: ClipboardList }] },
  { label: 'حسابك', links: [{ label: 'الإعدادات', path: '/settings', icon: Settings }] }
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const isMobile = window.matchMedia('(max-width: 820px)').matches;
    const toggleButton = toggleRef.current;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (isMobile) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('#student-mobile-actions a, #student-mobile-actions button')?.focus();
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
  const content = (
    <div className="sidebar-content">
      <div className="sidebar-kicker">مساحة الطالب</div>
      <nav aria-label="القائمة الرئيسية" className="sidebar-nav">
        {groups.map((group) => <div className="sidebar-nav-group" key={group.label}>
          <span className="sidebar-nav-group-label">{group.label}</span>
          {group.links.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/dashboard'} onClick={() => setOpen(false)} className={({ isActive }) => cn('nav-item', isActive && 'is-active')}><Icon size={19} strokeWidth={1.8} /><span>{label}</span></NavLink>)}
        </div>)}
      </nav>
      <div className="sidebar-study-card"><span><Target size={17} /></span><div><strong>خطوتك التالية</strong><p>راجع درسًا من المنهج ثم اختبر فهمك في الامتحان.</p></div></div>
      <div className="sidebar-note">
        <span className="orbit-dot" aria-hidden="true" />
        <div>
          <strong>مع Mr Electron</strong>
          <p>كل درس خطوة جديدة في فهم العلوم.</p>
        </div>
      </div>
      <div className="sidebar-account">
        <div className="sidebar-profile">
          <span className="sidebar-avatar">{user?.name?.charAt(0) || 'ط'}</span>
          <span><strong>{user?.name || 'الطالب'}</strong><small>{typeof user?.educationalLevel === 'object' ? user.educationalLevel.nameAr || 'صفك الدراسي' : 'صفك الدراسي'}</small></span>
          <UserRound size={16} aria-hidden="true" />
        </div>
        <button type="button" className="sidebar-logout" onClick={handleLogout}><LogOut size={16} /> تسجيل الخروج</button>
      </div>
    </div>
  );

  return (
    <div ref={menuRef} className="sidebar-slot">
      <button ref={toggleRef} id="student-sidebar-toggle" className="mobile-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-controls="student-mobile-actions" aria-expanded={open} aria-label={open ? 'إغلاق الاختصارات' : 'فتح الاختصارات'}>
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      <nav id="student-mobile-actions" className={cn('mobile-action-menu', open && 'is-open')} aria-label="اختصارات الطالب" aria-hidden={!open}>
        {groups.flatMap(({ links }) => links).map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/dashboard'} onClick={() => setOpen(false)} className={({ isActive }) => cn('mobile-action-item', isActive && 'is-active')}><Icon size={20} strokeWidth={1.9} aria-hidden="true" /><span className="mobile-action-label">{label}</span></NavLink>)}
      </nav>
      <aside id="student-sidebar" className={cn('sidebar', open && 'is-open')} aria-label="القائمة الرئيسية">{content}</aside>
    </div>
  );
};
