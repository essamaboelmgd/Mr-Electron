import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronLeft, Clock3, FileText, LockKeyhole, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Exam, getUserExams } from '@/services/examsService';

export default function ExamsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const filter = location.pathname.endsWith('/general') ? 'general' : location.pathname.endsWith('/course') ? 'course' : 'all';
  const load = () => { setLoading(true); setError(''); getUserExams().then(setExams).catch((requestError: any) => setError(requestError.response?.data?.message || 'تعذر تحميل الامتحانات.')).finally(() => setLoading(false)); };
  useEffect(load, []);
  const visible = useMemo(() => filter === 'all' ? exams : exams.filter((exam) => exam.type === filter), [exams, filter]);
  const filterLabel = filter === 'general' ? 'الامتحانات العامة' : filter === 'course' ? 'امتحانات الأبواب' : 'كل الامتحانات';

  return <AppShell><div className="page-stack"><section className="page-intro"><div><span className="eyebrow">قياس الفهم</span><h1>{filterLabel}</h1><p>اختبر فهمك بعد الدرس، وشوف النتيجة فورًا بعد التسليم.</p></div><div className="intro-mark exam-intro"><FileText size={27} /><span>{exams.length}<small>متاح</small></span></div></section><div className="filter-tabs" role="tablist"><button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => navigate('/exams')}>كل الامتحانات</button><button type="button" className={filter === 'general' ? 'is-active' : ''} onClick={() => navigate('/exams/general')}>عامة</button><button type="button" className={filter === 'course' ? 'is-active' : ''} onClick={() => navigate('/exams/course')}>امتحانات الأبواب</button></div>{error && <div className="inline-error" role="alert">{error}<button type="button" onClick={load}><RefreshCw size={15} /> إعادة المحاولة</button></div>}{loading ? <div className="loading-panel"><span className="spinner" /> جارٍ تحميل الامتحانات...</div> : visible.length === 0 ? <div className="empty-state"><CheckCircle2 size={27} /><h2>لا توجد امتحانات هنا بعد</h2><p>ستظهر الامتحانات التي يضيفها المدرس هنا.</p></div> : <div className="exam-grid">{visible.map((exam) => <article className="exam-card" key={exam._id}><div className="exam-card-top"><span className="exam-icon"><FileText size={18} /></span><span className={exam.type === 'general' ? 'status-label active' : 'status-label neutral'}>{exam.type === 'general' ? 'امتحان عام' : 'امتحان باب'}</span></div><h2>{exam.title}</h2><p>{exam.type === 'general' ? 'امتحان شامل على موضوعات العلوم لصفك.' : typeof exam.courseId === 'object' ? exam.courseId.title : 'امتحان مرتبط بباب من منهجك.'}</p><div className="exam-card-meta"><span><Clock3 size={15} /> {exam.timeLimitMin ? `${exam.timeLimitMin} دقيقة` : 'بدون وقت'}</span><span><BookOpen size={15} /> {exam.totalMarks || 0} درجات</span></div><button type="button" className="primary-button full-button" onClick={() => navigate(`/exams/${exam._id}/take`)}><span>ابدأ الامتحان</span><ChevronLeft size={16} /></button></article>)}</div>}</div></AppShell>;
}
