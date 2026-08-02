import { useState } from 'react';
import {
  ArrowLeft,
  Atom,
  Check,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';

const trimUrl = (value: string) => value.replace(/\/+$/, '');
const studentUrl = trimUrl(import.meta.env.VITE_STUDENT_URL || 'http://localhost:5174');
const adminUrl = trimUrl(import.meta.env.VITE_ADMIN_URL || 'http://localhost:5175');
const loginUrl = import.meta.env.VITE_LOGIN_URL || `${studentUrl}/login`;
const signupUrl = import.meta.env.VITE_SIGNUP_URL || `${studentUrl}/register`;

const grades = {
  primary: ['الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي', 'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي'],
  prep: ['الأول الإعدادي', 'الثاني الإعدادي', 'الثالث الإعدادي'],
};

const termNotes = {
  first: {
    label: 'الترم الأول',
    number: '01',
    title: 'نبني الأساس بهدوء.',
    copy: 'مفاهيم البداية مرتبة في أبواب قصيرة، عشان الطالب يعرف يبدأ منين ويتابع تقدمه.',
    rows: ['مفاهيم أساسية', 'تجارب وأسئلة فهم', 'امتحان عام للصف'],
  },
  second: {
    label: 'الترم الثاني',
    number: '02',
    title: 'نركّب الصورة كاملة.',
    copy: 'نرجع للمفاهيم ونبني عليها، مع دروس فيديو وامتحانات مرتبطة بكل باب.',
    rows: ['موضوعات جديدة', 'مراجعة داخل الباب', 'قياس الفهم'],
  },
};

const navItems = [
  { label: 'كيف تعمل', href: '#how-it-works' },
  { label: 'خريطة المنهج', href: '#curriculum' },
  { label: 'عن المدرس', href: '#teacher' },
];

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState<'first' | 'second'>('first');
  const selectedTerm = termNotes[term];

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <a className="landing-brand" href="#home" aria-label="Mr Electron - الصفحة الرئيسية">
          <span className="landing-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>mr electron</strong><small>منصة العلوم</small></span>
        </a>

        <nav className={`landing-nav ${menuOpen ? 'is-open' : ''}`} aria-label="التنقل الرئيسي">
          {navItems.map((item) => <a key={item.href} href={item.href} onClick={closeMenu}>{item.label}</a>)}
          <div className="mobile-nav-actions">
            <a className="text-link" href={loginUrl}>دخول الطالب</a>
            <a className="solid-button" href={signupUrl}>إنشاء حساب <ArrowLeft size={16} /></a>
          </div>
        </nav>

        <div className="header-actions">
          <a className="text-link" href={loginUrl}>دخول الطالب</a>
          <a className="solid-button small-button" href={signupUrl}>إنشاء حساب <ArrowLeft size={15} /></a>
        </div>
        <button className="menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={menuOpen}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <main>
        <section id="home" className="landing-hero">
          <div className="hero-grid page-width">
            <div className="hero-copy">
              <div className="paper-label"><span>MR / 01</span><b>ملاحظات معملية</b></div>
              <h1>افهم العلوم،<br /><em>واكتشفها بنفسك.</em></h1>
              <p>منصة Mr Electron بترتب منهج العلوم من الصف الأول الابتدائي لحد الثالث الإعدادي، في ترمين واضحين وأبواب تقدر تتابعها خطوة بخطوة.</p>
              <div className="hero-actions">
                <a className="solid-button hero-button" href={loginUrl}>ادخل إلى المنصة <ArrowLeft size={17} /></a>
                <a className="quiet-link" href="#how-it-works">شوف الطريقة <ChevronLeft size={16} /></a>
              </div>
              <div className="hero-note">
                <span className="note-pin"><Sparkles size={15} /></span>
                <p><strong>ابدأ من صفك.</strong> المدرس يفتح لك الباب، وكل درس بعده له مكان واضح.</p>
              </div>
            </div>

            <div className="lab-sheet-wrap" aria-label="خريطة Mr Electron للمنهج">
              <div className="lab-sheet">
                <div className="sheet-header"><span>SCIENCE / FIELD NOTE</span><strong>09</strong></div>
                <div className="sheet-title"><span>خريطة المنهج</span><small>منهج العلوم</small></div>
                <div className="orbit-diagram" aria-hidden="true">
                  <span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit orbit-three" />
                  <span className="orbit-core"><Atom size={32} /></span><i className="particle particle-a" /><i className="particle particle-b" /><i className="particle particle-c" />
                </div>
                <div className="sheet-list">
                  <div><span>01</span><strong>الترم الأول</strong><small>أساسيات وفهم</small></div>
                  <div><span>02</span><strong>الترم الثاني</strong><small>تطبيق ومراجعة</small></div>
                  <div><span>09</span><strong>صفوف دراسية</strong><small>ابتدائي وإعدادي</small></div>
                </div>
                <div className="sheet-footer"><span>AYMAN MESHALY</span><span>KEEP EXPLORING →</span></div>
              </div>
              <span className="sheet-caption">من الفكرة إلى التجربة</span>
            </div>
          </div>
          <div className="hero-baseline page-width"><span>منهج واضح · دروس فيديو · امتحانات فهم</span><span>اسحب لتكتشف الخريطة <ChevronDown size={15} /></span></div>
        </section>

        <section id="how-it-works" className="mechanism-section page-width">
          <div className="section-heading">
            <h2>المنصة مبنية حول طريقة مذاكرتك.</h2>
            <p>مش محتاج تدور على درس أو تسأل أين تبدأ. اختار صفك، والمنهج يتكشف قدامك بنفس الترتيب.</p>
          </div>
          <div className="mechanism-rail">
            <article className="mechanism-row"><span className="rail-number">01</span><div className="rail-icon"><GraduationCap size={20} /></div><div><h3>سجّل صفك</h3><p>اسم، رقم هاتف، صف دراسي وكلمة مرور. أربع خانات وتكون داخل مساحتك.</p></div><span className="rail-tail">الهوية</span></article>
            <article className="mechanism-row"><span className="rail-number">02</span><div className="rail-icon"><Layers3 size={20} /></div><div><h3>شوف خريطة المنهج</h3><p>الترمين مقسومين لأبواب، وكل باب يحتوي دروسه وامتحاناته.</p></div><span className="rail-tail">الخريطة</span></article>
            <article className="mechanism-row"><span className="rail-number">03</span><div className="rail-icon"><ClipboardCheck size={20} /></div><div><h3>اتعلم واختبر فهمك</h3><p>الفيديو يفتح بعد تفعيل المدرس، والامتحان يعطيك نتيجتك فورًا.</p></div><span className="rail-tail">التقدم</span></article>
          </div>
        </section>

        <section id="curriculum" className="curriculum-section">
          <div className="page-width">
            <div className="section-heading curriculum-heading"><h2>كل صف له خريطته.</h2><p>نطاق واضح للمرحلة، ومنهج لا يعرض للطالب إلا ما يخص صفه.</p></div>
            <div className="curriculum-board">
              <div className="grade-column">
                <div className="board-heading"><span>GRADES / 09</span><strong>الصفوف</strong></div>
                <div className="grade-group"><span>ابتدائي</span>{grades.primary.map((grade, index) => <div className="grade-row" key={grade}><b>{String(index + 1).padStart(2, '0')}</b>{grade}<Check size={14} /></div>)}</div>
                <div className="grade-group"><span>إعدادي</span>{grades.prep.map((grade, index) => <div className="grade-row" key={grade}><b>{String(index + 7).padStart(2, '0')}</b>{grade}<Check size={14} /></div>)}</div>
              </div>
              <div className="term-column">
                <div className="term-switch" role="tablist" aria-label="اختيار الترم">
                  {(Object.keys(termNotes) as Array<'first' | 'second'>).map((key) => <button key={key} type="button" role="tab" aria-selected={term === key} className={term === key ? 'is-active' : ''} onClick={() => setTerm(key)}><span>{termNotes[key].number}</span>{termNotes[key].label}</button>)}
                </div>
                <div className="term-document">
                  <span className="document-index">{selectedTerm.number}</span>
                  <h3>{selectedTerm.title}</h3>
                  <p>{selectedTerm.copy}</p>
                  <div className="document-list">{selectedTerm.rows.map((row) => <div key={row}><Check size={16} /> <span>{row}</span></div>)}</div>
                  <a className="quiet-link dark-link" href={signupUrl}>اختار صفك وابدأ <ArrowLeft size={16} /></a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="access" className="access-section page-width">
          <div className="access-diagram" aria-hidden="true"><div className="access-ring ring-large" /><div className="access-ring ring-small" /><span className="access-dot dot-one" /><span className="access-dot dot-two" /><span className="access-core"><LockKeyhole size={22} /></span></div>
          <div className="access-copy"><h2>المدرس يفتح لك الباب،<br /><em>وأنت تكمل الباقي.</em></h2><p>Mr Electron معمول لطلاب الدرس. مفيش اشتراكات ولا دفع أونلاين؛ المدرس هو اللي يفعّل الباب للطالب، والطالب يشوف المحتوى الخاص بصفه.</p><div className="access-points"><span><Check size={15} /> تفعيل يدوي للطالب</span><span><Check size={15} /> الدرس يفضل مقفول لحد ما يتفتح</span><span><Check size={15} /> فيديوهات YouTube أو Vimeo داخل المنصة</span></div></div>
        </section>

        <section id="teacher" className="teacher-section page-width">
          <div className="teacher-index">AYMAN<br /><strong>01</strong></div>
          <div><h2>علوم بشكل أوضح<br /><em>مع أيمن مشالي.</em></h2><p>مدرس علوم للمراحل الابتدائية والإعدادية، بيشرح الفكرة بطريقة تخلي الطالب يفهمها، يراجعها، ويعرف يختبر نفسه.</p></div>
          <a className="outline-button" href={adminUrl}>دخول المدرس <ArrowLeft size={16} /></a>
        </section>

        <section className="final-cta page-width"><div><span className="cta-mark"><Atom size={18} /></span><h2>جاهز تبدأ من صفك؟</h2><p>ادخل إلى منصة Mr Electron وشوف أول باب مفتوح لك.</p></div><a className="solid-button light-cta" href={loginUrl}>دخول إلى المنصة <ArrowLeft size={17} /></a></section>
      </main>

      <footer className="landing-footer page-width"><a className="landing-brand" href="#home"><span className="landing-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>mr electron</strong><small>منصة العلوم</small></span></a><span>منهج مرتب. فهم أعمق.</span><div><a href={loginUrl}>دخول الطالب</a><a href={adminUrl}>دخول المدرس</a></div></footer>
    </div>
  );
}
