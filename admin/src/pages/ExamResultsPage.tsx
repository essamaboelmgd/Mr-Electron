import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Download, Search, UserRound } from 'lucide-react';
import { useNavigate, useParams } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { Exam, ExamResultGroup, getExamById, getExamSubmissions } from '@/services/examsService';
import { downloadExamResultsReport } from '@/services/reportsService';

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export default function ExamResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [groups, setGroups] = useState<ExamResultGroup[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getExamById(id), getExamSubmissions(id, page, 20, search.trim())])
      .then(([examData, submissionData]) => {
        setExam(examData);
        setGroups(submissionData.groups);
        setPagination(submissionData.pagination);
      })
      .catch(() => setError('تعذر تحميل النتائج.'))
      .finally(() => setLoading(false));
  }, [id, page, search]);

  useEffect(() => { setPage(1); }, [search]);

  const downloadPdf = async () => {
    if (!id) return;
    setPdfLoading(true);
    try { await downloadExamResultsReport(id); } catch { setError('تعذر تجهيز ملف النتائج.'); } finally { setPdfLoading(false); }
  };

  if (loading) {
    return <AppShell><div className="admin-loading-panel"><span className="spinner" /> جارٍ تحميل النتائج...</div></AppShell>;
  }

  return <AppShell>
    <div className="admin-page-stack">
      <button type="button" className="admin-back-link" onClick={() => navigate(`/admin/exams/${id}`)}><ArrowRight size={17} /> العودة للامتحان</button>
      <section className="admin-page-intro">
        <div><span className="admin-eyebrow">متابعة الطلاب</span><h1>نتائج {exam?.title || 'الامتحان'}</h1><p>راجع كل محاولات الطلاب ودرجاتهم، مع معرفة المحاولة وسبب التسليم.</p></div>
        <div className="hero-actions"><span className="access-summary"><strong>{pagination?.totalItems || 0}</strong> طلاب</span><button type="button" className="admin-secondary" onClick={() => void downloadPdf()} disabled={pdfLoading}><Download size={15} /> {pdfLoading ? 'جارٍ التجهيز...' : 'تحميل PDF'}</button></div>
      </section>
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-toolbar results-toolbar"><div className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم الطالب أو رقم الهاتف" /></div></div>
      {groups.length === 0 ? <div className="admin-empty"><CheckCircle2 size={26} /><h2>لا توجد محاولات بعد</h2><p>{search ? 'لا يوجد طالب يطابق البحث الحالي.' : 'ستظهر النتائج هنا بعد حل الطلاب للامتحان.'}</p></div> : <section className="admin-panel grouped-results-panel">
        <div className="grouped-result-list">
          {groups.map((group) => <article className="exam-student-result-card" key={group.student._id}>
            <header className="exam-student-result-head"><span className="admin-course-title"><span className="student-avatar"><UserRound size={14} /></span><span><strong>{group.student.name || 'طالب'}</strong><small>{group.student.phone || '—'} · {group.student.educationalLevel?.nameAr || 'صف غير محدد'}</small></span></span><span className="exam-student-summary"><small>أفضل نتيجة</small><strong>{scorePercent(group.bestAttempt)}٪</strong></span><span className="exam-student-summary"><small>عدد المحاولات</small><strong>{group.attempts.length}</strong></span></header>
            <div className="admin-results-table admin-result-attempts"><div className="admin-table-head"><span>المحاولة</span><span>الدرجة</span><span>النسبة</span><span>التسليم</span><span>التاريخ</span></div>{group.attempts.map((submission) => <div className="admin-result-row" key={submission._id}><span><strong>المحاولة {submission.attemptNumber || 1}</strong>{submission.reviewedAt && <small className="admin-muted">تمت مراجعتها</small>}</span><strong>{submission.score} / {submission.totalMarks}</strong><span className={scorePercent(submission) >= 50 ? 'admin-status open' : 'admin-status closed'}>{scorePercent(submission)}٪</span><span className="admin-muted">{reasonLabel(submission.submittedReason)}</span><span className="admin-muted">{new Date(submission.submittedAt).toLocaleDateString('ar-EG')}</span></div>)}</div>
          </article>)}
        </div>
        {pagination && pagination.totalPages > 1 && <div className="pagination-controls">
          <button type="button" onClick={() => setPage((value) => value - 1)} disabled={!pagination.hasPrevPage}><ChevronRight size={15} /> السابق</button>
          <span>صفحة {pagination.currentPage} من {pagination.totalPages}</span>
          <button type="button" onClick={() => setPage((value) => value + 1)} disabled={!pagination.hasNextPage}>التالي <ChevronLeft size={15} /></button>
        </div>}
      </section>}
    </div>
  </AppShell>;
}

function scorePercent(value: { score: number; totalMarks: number }) {
  return value.totalMarks ? Math.round((value.score / value.totalMarks) * 100) : 0;
}

function reasonLabel(reason?: string) {
  if (reason === 'auto' || reason === 'timeout') return 'تسليم تلقائي لانتهاء الوقت';
  if (reason === 'legacy') return 'تسليم قديم';
  return 'تسليم يدوي';
}
