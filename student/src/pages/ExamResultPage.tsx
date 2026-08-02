import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, RotateCcw, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Exam, ExamResult, getExamById, getExamResults } from '@/services/examsService';

export default function ExamResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!id) return; Promise.all([getExamById(id), getExamResults(id)]).then(([examData, resultData]) => { setExam(examData); setResult(resultData); }).finally(() => setLoading(false)); }, [id]);
  if (loading) return <AppShell><div className="loading-panel"><span className="spinner" /> جارٍ تحميل النتيجة...</div></AppShell>;
  if (!exam || !result) return <AppShell><div className="error-state"><XCircle size={28} /><h1>النتيجة غير متاحة</h1><p>حل الامتحان أولًا لتظهر نتيجتك هنا.</p><button type="button" className="outline-button" onClick={() => navigate('/exams')}>العودة</button></div></AppShell>;
  const passed = result.isPassed;
  return <AppShell><div className="result-page page-stack"><button className="back-link" type="button" onClick={() => navigate('/exams')}><ArrowRight size={17} /> العودة للامتحانات</button><section className={`result-card ${passed ? 'is-passed' : 'is-failed'}`}><span className="result-seal">{passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}</span><span className="eyebrow">نتيجة {exam.type === 'general' ? 'الامتحان العام' : 'امتحان الباب'}</span><h1>{passed ? 'نتيجة ممتازة' : 'محاولة جيدة، نراجع ونحاول مرة أخرى'}</h1><p>{exam.title}</p><div className="score-display"><strong>{Math.round(result.percentage)}٪</strong><span>{result.submission.score} من {result.submission.totalMarks} درجات</span></div><div className="result-actions"><button type="button" className="primary-button" onClick={() => navigate(`/exams/${id}/review`)}><FileText size={16} /> مراجعة الإجابات</button>{!passed && <button type="button" className="outline-button" onClick={() => navigate(`/exams/${id}/take`)}><RotateCcw size={16} /> إعادة المحاولة</button>}</div></section></div></AppShell>;
}
