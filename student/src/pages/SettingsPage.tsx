import { useEffect, useState } from 'react';
import { LockKeyhole, Save, UserRound } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

export default function SettingsPage() {
  const { user, login } = useAuth();
  const [name, setName] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (user) setName(user.name); }, [user]);

  const saveName = async () => {
    if (!name.trim()) { setError('اكتب اسمًا صحيحًا.'); return; }
    setSaving(true); setError(''); setMessage('');
    try { const response = await api.put('/users/profile', { name: name.trim() }); login(response.data.data.user); setMessage('تم حفظ الاسم بنجاح.'); } catch (requestError: any) { setError(requestError.response?.data?.message || 'تعذر حفظ التغييرات.'); } finally { setSaving(false); }
  };
  const changePassword = async () => {
    if (!passwords.currentPassword || passwords.newPassword.length < 6 || passwords.newPassword !== passwords.confirm) { setError('راجع كلمات المرور: الجديدة 6 أحرف على الأقل والتأكيد مطابق.'); return; }
    setSaving(true); setError(''); setMessage('');
    try { await api.put('/users/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }); setPasswords({ currentPassword: '', newPassword: '', confirm: '' }); setMessage('تم تغيير كلمة المرور.'); } catch (requestError: any) { setError(requestError.response?.data?.message || 'تعذر تغيير كلمة المرور.'); } finally { setSaving(false); }
  };
  return <AppShell><div className="page-stack settings-page"><section className="page-intro"><div><span className="eyebrow">حسابك</span><h1>الإعدادات</h1><p>بياناتك الأساسية ثابتة على حسابك، ويمكنك تحديث الاسم وكلمة المرور.</p></div></section>{(error || message) && <div className={error ? 'inline-error' : 'inline-success'} role="status">{error || message}</div>}<section className="settings-card"><div className="settings-heading"><span className="settings-icon"><UserRound size={19} /></span><div><h2>البيانات الشخصية</h2><p>الصف الدراسي ورقم الهاتف مرتبطان بحساب التسجيل.</p></div></div><label>الاسم بالكامل<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>رقم الهاتف<input value={user?.phone || ''} disabled /></label><label>الصف الدراسي<input value={typeof user?.educationalLevel === 'object' ? user.educationalLevel.nameAr || '' : 'صفك الدراسي'} disabled /></label><button className="primary-button" type="button" onClick={saveName} disabled={saving}><Save size={16} /> حفظ الاسم</button></section><section className="settings-card"><div className="settings-heading"><span className="settings-icon"><LockKeyhole size={19} /></span><div><h2>تغيير كلمة المرور</h2><p>استخدم كلمة مرور لا يشاركها أحد معك.</p></div></div><label>كلمة المرور الحالية<input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords((value) => ({ ...value, currentPassword: event.target.value }))} /></label><label>كلمة المرور الجديدة<input type="password" value={passwords.newPassword} onChange={(event) => setPasswords((value) => ({ ...value, newPassword: event.target.value }))} /></label><label>تأكيد كلمة المرور الجديدة<input type="password" value={passwords.confirm} onChange={(event) => setPasswords((value) => ({ ...value, confirm: event.target.value }))} /></label><button className="outline-button" type="button" onClick={changePassword} disabled={saving}><LockKeyhole size={16} /> تحديث كلمة المرور</button></section></div></AppShell>;
}
