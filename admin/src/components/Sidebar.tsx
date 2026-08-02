import { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, LayoutDashboard, Menu, Settings, SlidersHorizontal, Users, X } from 'lucide-react';
import { NavLink } from '@/lib/router';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const groups = [
  { label: 'الرئيسية', links: [{ label: 'نظرة عامة', path: '/dashboard', icon: LayoutDashboard }] },
  { label: 'إدارة المحتوى', links: [{ label: 'المنهج والأبواب', path: '/curriculum', icon: BookOpen }, { label: 'الامتحانات', path: '/exams/manage', icon: ClipboardList }] },
  { label: 'متابعة الطلاب', links: [{ label: 'الطلاب', path: '/students', icon: Users }, { label: 'الإعدادات', path: '/settings', icon: Settings }] }
];

const roleLabels = { admin: 'مدير المنصة', teacher: 'مدرس العلوم', assistant: 'مساعد المدرس' } as const;

export const Sidebar = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('#admin-sidebar a, #admin-sidebar button')?.focus();
      });
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
      if (isMobile && previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);
  return <div className="admin-sidebar-slot">
    <button id="admin-sidebar-toggle" className="admin-mobile-menu" type="button" onClick={() => setOpen((value) => !value)} aria-controls="admin-sidebar" aria-expanded={open} aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}>{open ? <X size={21} /> : <Menu size={21} />}</button>
    {open && <button className="admin-mobile-overlay" type="button" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}
    <aside id="admin-sidebar" className={cn('admin-sidebar', open && 'is-open')} aria-label="قائمة الإدارة">
      <div className="admin-sidebar-inner">
        <div className="admin-sidebar-kicker"><SlidersHorizontal size={14} /> مساحة المدرس</div>
        <div className="admin-sidebar-profile">
          <span className="admin-sidebar-avatar">{user?.name?.charAt(0) || 'م'}</span>
          <span><strong>{user?.name || 'مدرس العلوم'}</strong><small>{user?.role ? roleLabels[user.role] : 'مساحة الإدارة'}</small></span>
        </div>
        <nav className="admin-nav">
          {groups.map((group) => <div className="admin-nav-group" key={group.label}>
            <span className="admin-nav-group-label">{group.label}</span>
            {group.links.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/dashboard'} onClick={() => setOpen(false)} className={({ isActive }) => cn('admin-nav-item', isActive && 'is-active')}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></NavLink>)}
          </div>)}
        </nav>
        <div className="admin-sidebar-summary"><div><strong>9</strong><small>صفوف</small></div><div><strong>يدوي</strong><small>تفعيل الطلاب</small></div></div>
        <div className="admin-sidebar-note"><strong>مساحة Mr Electron</strong><p>رتّب المحتوى، فعّل الأبواب، وتابع تقدّم طلابك من مكان واحد.</p></div>
      </div>
    </aside>
  </div>;
};
