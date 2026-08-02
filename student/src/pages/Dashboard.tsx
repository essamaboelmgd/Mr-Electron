import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronLeft, LockKeyhole, PlayCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Course, getCourses } from '@/services/coursesService';
import { getUserExams, Exam } from '@/services/examsService';

const termLabel = (term: Course['term']) => term === 'first' ? 'الترم الأول' : 'الترم الثاني';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getCourses(), getUserExams()]).then(([chapters, availableExams]) => { setCourses(chapters); setExams(availableExams); }).catch(() => setError('تعذر تحميل ملخص المنصة. أعد المحاولة.')).finally(() => setLoading(false));
  }, []);

  const activeChapters = courses.filter((course) => course.access === 'active').length;
  const lessonCount = courses.reduce((total, course) => total + (course.lessonCount || 0), 0);
  const firstChapter = useMemo(() => courses.find((course) => course.access === 'active'), [courses]);

  return (
    <AppShell>
      <div className="page-stack">
        <section className="dashboard-hero">
          <div className="hero-copy"><span className="eyebrow eyebrow-light"><Sparkles size={14} /> مساحة الطالب</span><h1>أهلًا يا {user?.name.split(' ')[0]}،<br /><em>جاهز تكتشف حاجة جديدة؟</em></h1><p>منهجك مرتب قدامك. اختار الباب وابدأ من آخر درس توقفت عنده.</p><button className="light-button" type="button" onClick={() => navigate(firstChapter ? `/courses/${firstChapter._id}` : '/courses')}>{firstChapter ? 'كمّل أول باب مفتوح' : 'استعرض المنهج'} <ArrowLeft size={17} /></button></div>
          <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><span>e</span><small>SCIENCE</small></div><i className="orbit-particle particle-one" /><i className="orbit-particle particle-two" /></div>
        </section>

        <div className="section-heading"><div><span className="eyebrow">لقطة سريعة</span><h2>منهجك اليوم</h2></div><button className="text-button" type="button" onClick={() => navigate('/courses')}>عرض المنهج <ChevronLeft size={17} /></button></div>
        {error && <div className="inline-error" role="alert">{error} <button type="button" onClick={() => window.location.reload()}>إعادة المحاولة</button></div>}
        {loading ? <div className="loading-panel"><span className="spinner" /> جارٍ تحميل بياناتك...</div> : <div className="metric-grid"><article className="metric-card accent-card"><span className="metric-icon"><BookOpen size={19} /></span><strong>{courses.length}</strong><span>باب في منهج صفك</span></article><article className="metric-card"><span className="metric-icon mint"><CheckCircle2 size={19} /></span><strong>{activeChapters}</strong><span>باب متاح لك الآن</span></article><article className="metric-card"><span className="metric-icon sand"><PlayCircle size={19} /></span><strong>{lessonCount}</strong><span>درس في الترمين</span></article><article className="metric-card"><span className="metric-icon lilac"><Sparkles size={19} /></span><strong>{exams.length}</strong><span>امتحان متاح</span></article></div>}

        <section className="curriculum-preview"><div className="section-heading compact"><div><span className="eyebrow">المحتوى الدراسي</span><h2>الترمين</h2></div><span className="grade-pill">{typeof user?.educationalLevel === 'object' ? user.educationalLevel.nameAr : 'صفك الدراسي'}</span></div><div className="term-columns">{(['first', 'second'] as Course['term'][]).map((term) => { const termCourses = courses.filter((course) => course.term === term); return <div className="term-column" key={term}><div className="term-title"><span>{term === 'first' ? '01' : '02'}</span><div><h3>{termLabel(term)}</h3><p>{termCourses.length} أبواب في الخطة</p></div></div>{termCourses.length === 0 ? <div className="empty-mini">لم يضف المدرس أبواب هذا الترم بعد.</div> : termCourses.slice(0, 3).map((course) => <button className="chapter-mini" type="button" key={course._id} onClick={() => navigate(`/courses/${course._id}`)}><span className={course.access === 'active' ? 'chapter-status open' : 'chapter-status'}>{course.access === 'active' ? <PlayCircle size={15} /> : <LockKeyhole size={15} />}</span><span><strong>{course.title}</strong><small>{course.lessonCount || 0} درس · {course.access === 'active' ? 'متاح الآن' : 'محتوى مقفول'}</small></span><ChevronLeft size={17} /></button>)}</div>; })}</div></section>
      </div>
    </AppShell>
  );
}
