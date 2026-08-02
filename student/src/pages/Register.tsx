import { FormEvent, useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { Link, useNavigate } from '@/lib/router';
import { ArrowLeft, Check, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { register, setAuthToken, setAuthUser } from '@/services/authService';
import { getEducationalLevels, EducationalLevel } from '@/services/educationalLevelService';
import { useAuth } from '@/contexts/AuthContext';

const landingUrl = (import.meta.env.VITE_LANDING_URL || 'http://localhost:5173').replace(/\/+$/, '');

export default function Register() {
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', educationalLevel: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getEducationalLevels().then((response) => setLevels(response.data)).catch(() => setError('تعذر تحميل الصفوف الدراسية. أعد المحاولة.')).finally(() => setLevelsLoading(false));
  }, []);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.educationalLevel || !form.password) {
      setError('أكمل البيانات المطلوبة كلها.');
      return;
    }
    if (form.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await register({ name: form.name.trim(), phone: form.phone.trim(), educationalLevel: form.educationalLevel, password: form.password });
      setAuthToken(response.token);
      setAuthUser(response.data.user);
      setUser(response.data.user);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      const error = requestError as AxiosError<{ message?: string | string[] }>;
      const message = error.response?.data?.message;
      setError(Array.isArray(message) ? message.join('، ') : message || 'تعذر إنشاء الحساب. راجع البيانات وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-register">
      <div className="auth-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <section className="auth-aside">
        <div className="brand-lockup auth-brand"><span className="brand-mark"><span /><span /><span /></span><span className="brand-text"><b>mr electron</b><small>منصة العلوم</small></span></div>
        <div className="auth-aside-copy"><span className="eyebrow">بداية بسيطة</span><h1>سجّل صفك،<br /><em>وابدأ رحلتك.</em></h1><p>نرتب لك المنهج على شكل أبواب ودروس واضحة تناسب الصف الذي اخترته.</p></div>
        <div className="benefit-list"><span><Check size={15} /> منهج مرتب على ترمين</span><span><Check size={15} /> دروس فيديو من المدرس</span><span><Check size={15} /> امتحانات لقياس تقدمك</span></div>
      </section>
      <main className="auth-card-wrap">
        <div className="auth-card register-card">
          <a className="auth-back-link" href={landingUrl}>← الصفحة التعريفية</a>
          <div className="auth-heading"><p className="eyebrow">طالب جديد؟</p><h2>إنشاء حساب</h2><p>بيانات بسيطة تكفي لنوصلك إلى منهج صفك.</p></div>
          <form onSubmit={submit} className="auth-form">
            <label>الاسم بالكامل<input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="اكتب اسمك" autoComplete="name" /></label>
            <label>رقم الهاتف<input value={form.phone} onChange={(event) => update('phone', event.target.value)} type="tel" inputMode="numeric" placeholder="01xxxxxxxxx" autoComplete="tel" /></label>
            <label>الصف الدراسي
              <span className="select-wrap"><select value={form.educationalLevel} onChange={(event) => update('educationalLevel', event.target.value)} disabled={levelsLoading}><option value="">{levelsLoading ? 'جارٍ تحميل الصفوف...' : 'اختر الصف الدراسي'}</option>{levels.map((level) => <option value={level._id} key={level._id}>{level.nameAr}</option>)}</select><ChevronDown size={17} /></span>
            </label>
            <label>كلمة المرور<span className="input-with-action"><input value={form.password} onChange={(event) => update('password', event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="6 أحرف أو أرقام على الأقل" autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="إظهار كلمة المرور">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            <label>تأكيد كلمة المرور<input value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="أعد كتابة كلمة المرور" autoComplete="new-password" /></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button full-button" type="submit" disabled={loading}>{loading ? <><span className="spinner spinner-light" /> جارٍ إنشاء الحساب...</> : <>إنشاء الحساب <ArrowLeft size={17} /></>}</button>
          </form>
          <p className="auth-switch">لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link></p>
        </div>
      </main>
    </div>
  );
}
