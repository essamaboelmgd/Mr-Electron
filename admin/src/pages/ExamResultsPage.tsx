import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, UserRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Exam, getExamById, getExamSubmissions, Submission } from '@/services/examsService';

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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getExamById(id), getExamSubmissions(id, page, 20)])
      .then(([examData, submissionData]) => {
        setExam(examData);
        setSubmissions(submissionData.submissions);
        setPagination(submissionData.pagination);
      })
      .catch(() => setError('تعذر تحميل النتائج.'))
      .finally(() => setLoading(false));
  }, [id, page]);

  if (loading) {
    return <AppShell><div className="admin-loading-panel"><span className="spinner" /> جارٍ تحميل النتائج...</div></AppShell>;
  }

  return <AppShell>
    <div className="admin-page-stack">
      <button type="button" className="admin-back-link" onClick={() => navigate(`/admin/exams/${id}`)}><ArrowRight size={17} /> العودة للامتحان</button>
      <section className="admin-page-intro">
        <div><span className="admin-eyebrow">متابعة الطلاب</span><h1>نتائج {exam?.title || 'الامتحان'}</h1><p>راجع كل محاولات الطلاب ودرجاتهم، مع معرفة المحاولة وسبب التسليم.</p></div>
        <span className="access-summary"><strong>{pagination?.totalItems || 0}</strong> محاولات</span>
      </section>
      {error && <div className="admin-error">{error}</div>}
      {submissions.length === 0 ? <div className="admin-empty"><CheckCircle2 size={26} /><h2>لا توجد محاولات بعد</h2><p>ستظهر النتائج هنا بعد حل الطلاب للامتحان.</p></div> : <section className="admin-panel">
        <div className="admin-results-table">
          <div className="admin-table-head"><span>الطالب</span><span>المحاولة</span><span>الدرجة</span><span>النسبة</span><span>التاريخ</span></div>
          {submissions.map((submission) => {
            const student = typeof submission.userId === 'object' ? submission.userId : null;
            const percentage = submission.totalMarks ? Math.round((submission.score / submission.totalMarks) * 100) : 0;
            return <article className="admin-result-row" key={submission._id}>
              <span className="admin-course-title"><span className="student-avatar"><UserRound size={14} /></span><span><strong>{student?.name || 'طالب'}</strong><small>{student?.phone || '—'}</small></span></span>
              <span><strong>{submission.attemptNumber || 1}</strong><small className="admin-muted">{submission.submittedReason === 'timeout' ? 'انتهى الوقت' : 'تسليم يدوي'}</small></span>
              <strong>{submission.score} / {submission.totalMarks}</strong>
              <span className={percentage >= 50 ? 'admin-status open' : 'admin-status closed'}>{percentage}٪</span>
              <span className="admin-muted">{new Date(submission.submittedAt).toLocaleDateString('ar-EG')}</span>
            </article>;
          })}
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
