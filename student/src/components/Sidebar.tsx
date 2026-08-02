import { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, LayoutDashboard, Menu, Settings, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const links = [
  { label: 'الرئيسية', path: '/dashboard', icon: LayoutDashboard },
  { label: 'المنهج', path: '/courses', icon: BookOpen },
  { label: 'الامتحانات', path: '/exams', icon: ClipboardList },
  { label: 'الإعدادات', path: '/settings', icon: Settings }
];

export const Sidebar = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (window.innerWidth <= 820) document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
  const content = (
    <div className="sidebar-content">
      <div className="sidebar-kicker">مساحة الطالب</div>
      <nav aria-label="القائمة الرئيسية" className="sidebar-nav">
        {links.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/courses' || path === '/exams'}
            onClick={() => setOpen(false)}
            className={({ isActive }) => cn('nav-item', isActive && 'is-active')}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
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
    <>
      <button id="student-sidebar-toggle" className="mobile-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-controls="student-sidebar" aria-expanded={open} aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}>
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      {open && <button className="mobile-overlay" type="button" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}
      <aside id="student-sidebar" className={cn('sidebar', open && 'is-open')} aria-label="القائمة الرئيسية">{content}</aside>
    </>
  );
};
