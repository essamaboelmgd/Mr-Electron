import { FormEvent, useState } from 'react';
import type { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Atom, Eye, EyeOff } from 'lucide-react';
import { login, setAuthToken, setAuthUser } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

const landingUrl = (import.meta.env.VITE_LANDING_URL || 'http://localhost:5173').replace(/\/+$/, '');

export default function Login() {
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!phone.trim() || !password) {
      setError('اكتب رقم الهاتف وكلمة المرور للمتابعة.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await login({ phone: phone.trim(), password });
      setAuthToken(response.token);
      setAuthUser(response.data.user);
      setUser(response.data.user);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      const error = requestError as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || 'بيانات الدخول غير صحيحة. جرّب مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <section className="auth-aside">
        <div className="brand-lockup auth-brand"><span className="brand-mark"><span /><span /><span /></span><span className="brand-text"><b>mr electron</b><small>منصة العلوم</small></span></div>
        <div className="auth-aside-copy">
          <span className="eyebrow"><Atom size={14} /> علوم بشكل أوضح</span>
          <h1>اكتشف الفكرة،<br /><em>ثم جرّبها.</em></h1>
          <p>مكانك لمتابعة أبواب العلوم، مشاهدة الدروس، ومعرفة مستواك في كل امتحان.</p>
        </div>
        <div className="science-line"><span /> <b>01</b> <i /> <b>02</b> <i /> <b>03</b></div>
      </section>
      <main className="auth-card-wrap">
        <div className="auth-card">
          <a className="auth-back-link" href={landingUrl}>← الصفحة التعريفية</a>
          <div className="auth-heading">
            <span className="mobile-auth-mark"><span className="brand-mark"><span /><span /><span /></span></span>
            <p className="eyebrow">مرحبًا بعودتك</p>
            <h2>تسجيل الدخول</h2>
            <p>ادخل إلى حسابك وكمّل من حيث توقفت.</p>
          </div>
          <form onSubmit={submit} className="auth-form">
            <label>رقم الهاتف<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="numeric" placeholder="01xxxxxxxxx" autoComplete="tel" /></label>
            <label>كلمة المرور
              <span className="input-with-action"><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
            </label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button full-button" type="submit" disabled={loading}>{loading ? <><span className="spinner spinner-light" /> جارٍ الدخول...</> : <>دخول إلى المنصة <ArrowLeft size={17} /></>}</button>
          </form>
          <p className="auth-switch">ليس لديك حساب؟ <Link to="/register">إنشاء حساب جديد</Link></p>
        </div>
      </main>
    </div>
  );
}
