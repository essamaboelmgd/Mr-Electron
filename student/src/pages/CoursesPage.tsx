import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronLeft, LockKeyhole, PlayCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Course, getCourses } from '@/services/coursesService';

const termLabel = (term: Course['term']) => term === 'first' ? 'الترم الأول' : 'الترم الثاني';

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [term, setTerm] = useState<'all' | Course['term']>('all');

  const load = () => { setLoading(true); setError(''); getCourses().then(setCourses).catch(() => setError('تعذر تحميل المنهج.')).finally(() => setLoading(false)); };
  useEffect(load, []);
  const visibleCourses = useMemo(() => term === 'all' ? courses : courses.filter((course) => course.term === term), [courses, term]);

  return <AppShell><div className="page-stack"><section className="page-intro"><div><span className="eyebrow">الخطة الدراسية</span><h1>منهج العلوم</h1><p>كل باب له مكانه. افتح أي باب لتشوف دروسه، حتى لو لسه مقفول.</p></div><div className="intro-mark"><BookOpen size={27} /><span>6 + 3<br /><small>صفوف</small></span></div></section><div className="filter-tabs" role="tablist" aria-label="اختيار الترم">{[['all', 'كل الترمين'], ['first', 'الترم الأول'], ['second', 'الترم الثاني']].map(([value, label]) => <button type="button" key={value} onClick={() => setTerm(value as any)} className={term === value ? 'is-active' : ''} role="tab" aria-selected={term === value}>{label}</button>)}</div>{error && <div className="inline-error" role="alert">{error}<button type="button" onClick={load}><RefreshCw size={15} /> إعادة المحاولة</button></div>}{loading ? <div className="loading-panel"><span className="spinner" /> جارٍ تحميل أبواب المنهج...</div> : visibleCourses.length === 0 ? <div className="empty-state"><BookOpen size={25} /><h2>المنهج يتجهز لك</h2><p>لم يضف المدرس أبوابًا لهذا الاختيار حتى الآن.</p></div> : <div className="course-list">{visibleCourses.map((course, index) => <article className={`chapter-card ${course.access === 'locked' ? 'is-locked' : ''}`} key={course._id}><div className="chapter-index">{String(index + 1).padStart(2, '0')}</div><div className="chapter-info"><div className="chapter-topline"><span className="scope-label">{termLabel(course.term)}</span><span className={course.access === 'active' ? 'status-label active' : 'status-label locked'}>{course.access === 'active' ? <><PlayCircle size={13} /> مفتوح لك</> : <><LockKeyhole size={13} /> مقفول حاليًا</>}</span></div><h2>{course.title}</h2><p>{course.description || 'دروس العلوم الخاصة بهذا الباب.'}</p><div className="chapter-meta"><span>{course.lessonCount || 0} دروس</span><span>{course.examCount || 0} امتحانات</span></div></div><button type="button" className={course.access === 'active' ? 'outline-button' : 'quiet-button'} onClick={() => navigate(`/courses/${course._id}`)}>{course.access === 'active' ? 'ابدأ الباب' : 'عرض المحتوى'} <ArrowLeft size={16} /></button></article>)}</div>}</div></AppShell>;
}
