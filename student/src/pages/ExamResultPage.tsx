import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Download, FileText, RotateCcw, XCircle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { Exam, ExamResult, getExamById, getExamResults } from '@/services/examsService';
import { downloadStudentExamReport } from '@/services/reportsService';

type AttemptResult = NonNullable<ExamResult['attempts']>[number];

export default function ExamResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  useEffect(() => { if (!id) return; Promise.all([getExamById(id), getExamResults(id, searchParams.get('attemptId') || undefined)]).then(([examData, resultData]) => { setExam(examData); setResult(resultData); }).finally(() => setLoading(false)); }, [id, searchParams]);
  if (loading) return <AppShell><div className="loading-panel"><span className="spinner" /> جارٍ تحميل النتيجة...</div></AppShell>;
  if (!exam || !result) return <AppShell><div className="error-state"><XCircle size={28} /><h1>النتيجة غير متاحة</h1><p>حل الامتحان أولًا لتظهر نتيجتك هنا.</p><button type="button" className="outline-button" onClick={() => navigate('/exams')}>العودة</button></div></AppShell>;
  const passed = result.isPassed;
  const attempts = result.attempts || [result.submission];
  const maxAttempts = result.policy?.maxAttempts || exam.maxAttempts || 1;
  const reviewed = Boolean(result.reviewed || result.submission.reviewedAt);
  const canRetake = !reviewed && attempts.length < maxAttempts;
  const canReview = Boolean(result.policy?.reviewAvailable);
  const reviewAttemptId = result.reviewAttemptId || result.submission._id;
  const downloadPdf = async () => {
    if (!id) return;
    setPdfLoading(true);
    try { await downloadStudentExamReport(id, result.submission._id); } finally { setPdfLoading(false); }
  };
  return <AppShell><div className="result-page page-stack"><button className="back-link" type="button" onClick={() => navigate('/exams')}><ArrowRight size={17} /> العودة للامتحانات</button><section className={`result-card ${passed ? 'is-passed' : 'is-failed'}`}><span className="result-seal">{passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}</span><span className="eyebrow">نتيجة {exam.type === 'general' ? 'الامتحان العام' : 'امتحان الباب'} · المحاولة {result.submission.attemptNumber || 1}</span><h1>{passed ? 'نتيجة ممتازة' : 'محاولة جيدة، نراجع ونحاول مرة أخرى'}</h1><p>{exam.title}</p><div className="score-display"><strong>{Math.round(result.percentage)}٪</strong><span>{result.submission.score} من {result.submission.totalMarks} درجات</span></div>{reviewed && <div className="inline-notice result-review-lock" role="status">تمت مراجعة الإجابات. إعادة الامتحان مغلقة لهذا الامتحان.</div>}<div className="result-actions">{canReview ? <button type="button" className="primary-button" onClick={() => navigate(`/exams/${id}/review?attemptId=${reviewAttemptId}`)}><FileText size={16} /> مراجعة الإجابات</button> : <span className="result-review-closed">المراجعة مغلقة حاليًا من المدرس</span>}{canRetake && <button type="button" className="outline-button" onClick={() => navigate(`/exams/${id}/take`)}><RotateCcw size={16} /> إعادة المحاولة</button>}<button type="button" className="quiet-button" onClick={() => void downloadPdf()} disabled={pdfLoading}><Download size={16} /> {pdfLoading ? 'جارٍ تجهيز PDF...' : 'تحميل النتيجة PDF'}</button></div></section>{attempts.length > 1 && <section className="attempt-history"><div className="section-heading compact"><div><span className="eyebrow">سجل المحاولات</span><h2>نتائجك السابقة</h2></div><span className="count-chip">{attempts.length} محاولات</span></div><div className="attempt-history-list">{attempts.map((attempt: AttemptResult, index) => <button type="button" className={`attempt-history-row ${attempt._id === result.submission._id ? 'is-current' : ''}`} key={attempt._id} onClick={() => navigate(`/exams/${id}/result?attemptId=${attempt._id}`)}><span>المحاولة {attempt.attemptNumber || attempts.length - index}</span><strong>{Math.round(attempt.percentage ?? (attempt.totalMarks ? (attempt.score / attempt.totalMarks) * 100 : 0))}٪</strong><small>{new Date(attempt.submittedAt).toLocaleDateString('ar-EG')}</small></button>)}</div></section>}</div></AppShell>;
}
