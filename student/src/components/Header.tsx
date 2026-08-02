import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Home, LogOut, Settings } from 'lucide-react';
import { useNavigate } from '@/lib/router';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/services/authService';

const landingUrl = (import.meta.env.VITE_LANDING_URL || 'http://localhost:5173').replace(/\/+$/, '');

export const Header = ({ student }: { student: User }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand-lockup" type="button" onClick={() => navigate('/dashboard')} aria-label="العودة للرئيسية">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="brand-text"><b>mr electron</b><small>منصة العلوم</small></span>
        </button>
        <div className="topbar-actions">
          <span className="welcome-chip">أهلًا، {student.name.split(' ')[0]}</span>
          <div ref={profileRef} className="profile-wrap">
            <button className="profile-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-haspopup="menu" aria-controls="student-profile-menu">
              <span className="profile-avatar">{student.name.charAt(0)}</span>
              <ChevronDown size={16} />
            </button>
            {menuOpen && (
              <div id="student-profile-menu" className="profile-menu" role="menu">
                <a role="menuitem" className="profile-link" href={landingUrl}><Home size={16} /> الصفحة التعريفية</a>
                <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); navigate('/settings'); }}><Settings size={16} /> الإعدادات</button>
                <button role="menuitem" type="button" className="danger-action" onClick={handleLogout}><LogOut size={16} /> تسجيل الخروج</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
