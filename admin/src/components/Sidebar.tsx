import { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, LayoutDashboard, Menu, Settings, SlidersHorizontal, Users, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const links = [
  { label: 'نظرة عامة', path: '/dashboard', icon: LayoutDashboard },
  { label: 'المنهج والأبواب', path: '/curriculum', icon: BookOpen },
  { label: 'الطلاب', path: '/students', icon: Users },
  { label: 'الامتحانات', path: '/exams/manage', icon: ClipboardList },
  { label: 'الإعدادات', path: '/settings', icon: Settings }
];

export const Sidebar = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open || window.innerWidth > 760) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  return <><button className="admin-mobile-menu" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}>{open ? <X size={21} /> : <Menu size={21} />}</button>{open && <button className="admin-mobile-overlay" type="button" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}<aside className={cn('admin-sidebar', open && 'is-open')}><div className="admin-sidebar-inner"><div className="admin-sidebar-kicker"><SlidersHorizontal size={14} /> مساحة المدرس</div><nav className="admin-nav" aria-label="قائمة الإدارة">{links.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/dashboard' || path === '/students'} onClick={() => setOpen(false)} className={({ isActive }) => cn('admin-nav-item', isActive && 'is-active')}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></NavLink>)}</nav><div className="admin-sidebar-note"><strong>لوحة Mr Electron</strong><p>فعّل الأبواب للطلاب، وحدث المحتوى من مكان واحد.</p></div></div></aside></>;
};
