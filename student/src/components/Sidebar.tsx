import { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, LayoutDashboard, Menu, Settings, Target, UserRound, X } from 'lucide-react';
import { NavLink } from '@/lib/router';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const groups = [
  { label: 'ابدأ من هنا', links: [{ label: 'الرئيسية', path: '/dashboard', icon: LayoutDashboard }] },
  { label: 'التعلّم', links: [{ label: 'المنهج', path: '/courses', icon: BookOpen }, { label: 'الامتحانات', path: '/exams', icon: ClipboardList }] },
  { label: 'حسابك', links: [{ label: 'الإعدادات', path: '/settings', icon: Settings }] }
];

export const Sidebar = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const isMobile = window.matchMedia('(max-width: 820px)').matches;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('#student-sidebar a, #student-sidebar button')?.focus();
      });
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
      if (isMobile && previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);
  const content = (
    <div className="sidebar-content">
      <div className="sidebar-kicker">مساحة الطالب</div>
      <div className="sidebar-profile">
        <span className="sidebar-avatar">{user?.name?.charAt(0) || 'ط'}</span>
        <span><strong>{user?.name || 'الطالب'}</strong><small>{typeof user?.educationalLevel === 'object' ? user.educationalLevel.nameAr || 'صفك الدراسي' : 'صفك الدراسي'}</small></span>
        <UserRound size={16} aria-hidden="true" />
      </div>
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
    </div>
  );

  return (
    <div className="sidebar-slot">
      <button id="student-sidebar-toggle" className="mobile-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-controls="student-sidebar" aria-expanded={open} aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}>
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      {open && <button className="mobile-overlay" type="button" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}
      <aside id="student-sidebar" className={cn('sidebar', open && 'is-open')} aria-label="القائمة الرئيسية">{content}</aside>
    </div>
  );
};
