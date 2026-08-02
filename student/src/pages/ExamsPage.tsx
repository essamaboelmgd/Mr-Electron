import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronLeft, Clock3, FileText, RefreshCw, RotateCcw } from 'lucide-react';
import { useLocation, useNavigate } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { Exam, getUserExams } from '@/services/examsService';

const requestMessage = (error: unknown, fallback: string) => {
  const typed = error as { response?: { data?: { message?: string } } };
  return typed.response?.data?.message || fallback;
};

export default function ExamsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number; hasNextPage: boolean; hasPrevPage: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const filter = location.pathname.endsWith('/general') ? 'general' : location.pathname.endsWith('/course') ? 'course' : 'all';
  const load = () => { setLoading(true); setError(''); getUserExams({ type: filter === 'all' ? undefined : filter, page, limit: 12 }).then((result) => { setExams(result.exams); setPagination(result.pagination); }).catch((requestError: unknown) => setError(requestMessage(requestError, 'تعذر تحميل الامتحانات.'))).finally(() => setLoading(false)); };
  useEffect(load, [filter, page]);
  const visible = useMemo(() => filter === 'all' ? exams : exams.filter((exam) => exam.type === filter), [exams, filter]);
  const filterLabel = filter === 'general' ? 'الامتحانات العامة' : filter === 'course' ? 'امتحانات الأبواب' : 'كل الامتحانات';

  return <AppShell><div className="page-stack"><section className="page-intro"><div><span className="eyebrow">قياس الفهم</span><h1>{filterLabel}</h1><p>اختبر فهمك بعد الدرس، وشوف النتيجة فورًا بعد التسليم.</p></div><div className="intro-mark exam-intro"><FileText size={27} /><span>{pagination?.totalItems || exams.length}<small>متاح</small></span></div></section><div className="filter-tabs" role="tablist"><button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => { setPage(1); navigate('/exams'); }}>كل الامتحانات</button><button type="button" className={filter === 'general' ? 'is-active' : ''} onClick={() => { setPage(1); navigate('/exams/general'); }}>عامة</button><button type="button" className={filter === 'course' ? 'is-active' : ''} onClick={() => { setPage(1); navigate('/exams/course'); }}>امتحانات الأبواب</button></div>{error && <div className="inline-error" role="alert">{error}<button type="button" onClick={load}><RefreshCw size={15} /> إعادة المحاولة</button></div>}{loading ? <div className="loading-panel"><span className="spinner" /> جارٍ تحميل الامتحانات...</div> : visible.length === 0 ? <div className="empty-state"><CheckCircle2 size={27} /><h2>لا توجد امتحانات هنا بعد</h2><p>ستظهر الامتحانات التي يضيفها المدرس هنا.</p></div> : <><div className="exam-grid">{visible.map((exam) => {
    const state = exam.studentState;
    const latest = state?.latestAttempt;
    const completed = Boolean(latest);
    const reviewTarget = state?.reviewAttemptId || latest?.id;
    return <article className={`exam-card ${completed ? 'is-completed' : ''}`} key={exam._id}>
      <div className="exam-card-top"><span className="exam-icon"><FileText size={18} /></span><span className={exam.type === 'general' ? 'status-label active' : 'status-label neutral'}>{exam.type === 'general' ? 'امتحان عام' : 'امتحان باب'}</span></div>
      <h2>{exam.title}</h2>
      <p>{exam.type === 'general' ? 'امتحان شامل على موضوعات العلوم لصفك.' : typeof exam.courseId === 'object' ? exam.courseId.title : 'امتحان مرتبط بباب من منهجك.'}</p>
      <div className="exam-card-meta"><span><Clock3 size={15} /> {exam.timeLimitMin ? `${exam.timeLimitMin} دقيقة` : 'بدون وقت'}</span><span><BookOpen size={15} /> {exam.totalMarks || 0} درجات</span></div>
      {completed && <div className="exam-completion-row"><span className="status-label active"><CheckCircle2 size={14} /> تم الإنهاء</span><strong>{Math.round(latest?.percentage || 0)}٪</strong><small>{latest?.score || 0} من {latest?.totalMarks || exam.totalMarks || 0}</small></div>}
      {completed && state?.reviewed && <div className="exam-review-lock">تمت مراجعة الإجابات، لذلك أُغلقت إعادة الامتحان.</div>}
      <div className="exam-card-actions">
        {!completed && <button type="button" className="primary-button full-button" onClick={() => navigate(`/exams/${exam._id}/take`)}><span>ابدأ الامتحان</span><ChevronLeft size={16} /></button>}
        {completed && state?.canReview && reviewTarget && <button type="button" className="primary-button full-button" onClick={() => navigate(`/exams/${exam._id}/review?attemptId=${reviewTarget}`)}><span>راجع إجاباتك</span><FileText size={16} /></button>}
        {completed && state?.canRetake && !state.reviewed && <button type="button" className="outline-button full-button" onClick={() => navigate(`/exams/${exam._id}/take`)}><RotateCcw size={15} /> إعادة الامتحان</button>}
        {completed && !state?.reviewAvailable && <span className="exam-review-closed">المراجعة مغلقة حاليًا من المدرس.</span>}
      </div>
    </article>;
  })}</div>{pagination && pagination.totalPages > 1 && <div className="pagination-controls"><button type="button" onClick={() => setPage((value) => value - 1)} disabled={!pagination.hasPrevPage}>السابق</button><span>صفحة {pagination.currentPage} من {pagination.totalPages}</span><button type="button" onClick={() => setPage((value) => value + 1)} disabled={!pagination.hasNextPage}>التالي</button></div>}</>}</div></AppShell>;
}
