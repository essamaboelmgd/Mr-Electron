import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, FileText, XCircle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Exam, ExamResult, getExamById, getExamQuestions, getExamResults, Question } from '@/services/examsService';

export default function ExamReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!id) return; const attemptId = searchParams.get('attemptId') || undefined; Promise.all([getExamById(id), getExamResults(id, attemptId), getExamQuestions(id, true, attemptId)]).then(([examData, resultData, questionData]) => { setExam(examData); setResult(resultData); setQuestions(questionData); }).finally(() => setLoading(false)); }, [id, searchParams]);
  if (loading) return <AppShell><div className="loading-panel"><span className="spinner" /> جارٍ تجهيز المراجعة...</div></AppShell>;
  if (!exam || !result) return <AppShell><div className="error-state"><h1>المراجعة غير متاحة</h1><p>المراجعة مغلقة حاليًا أو لم يحدد المدرس موعد فتحها.</p><button type="button" className="outline-button" onClick={() => navigate('/exams')}>العودة</button></div></AppShell>;
  const answerMap = new Map(result.submission.answers.map((answer) => [String(answer.questionId), answer.selectedOption]));
  return <AppShell><div className="page-stack"><button className="back-link" type="button" onClick={() => navigate(`/exams/${id}/result`)}><ArrowRight size={17} /> العودة للنتيجة</button><section className="page-intro review-intro"><div><span className="eyebrow">مراجعة الإجابات</span><h1>{exam.title}</h1><p>راجع اختيارك وتعرف على الإجابة الصحيحة.</p></div><span className="grade-pill">{Math.round(result.percentage)}٪</span></section><div className="review-list">{questions.map((question, index) => { const selected = answerMap.get(question._id); const correct = question.correct; const isCorrect = Boolean(selected && correct && selected === correct); const selectedText = question.options.find((option) => option.id === selected)?.text; const correctText = question.options.find((option) => option.id === correct)?.text; return <article className="review-card" key={question._id}><div className="review-card-head"><span>سؤال {String(index + 1).padStart(2, '0')}</span>{isCorrect ? <span className="review-status right"><CheckCircle2 size={15} /> صحيح</span> : <span className="review-status wrong"><XCircle size={15} /> راجع الإجابة</span>}</div><h2>{question.content}</h2><div className="review-answer"><span className="answer-label">إجابتك</span><strong>{selectedText || 'لم تتم الإجابة'}</strong></div>{!isCorrect && correctText && <div className="review-answer correct-answer"><span className="answer-label">الإجابة الصحيحة</span><strong>{correctText}</strong></div>}{question.explanation && <details><summary>عرض الشرح <ChevronDown size={15} /></summary><p>{question.explanation}</p></details>}</article>; })}</div><button type="button" className="outline-button review-back" onClick={() => navigate('/exams')}><FileText size={16} /> العودة لكل الامتحانات</button></div></AppShell>;
}
