import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, LockKeyhole, Send, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Answer, Exam, getExamById, getExamQuestions, getExamResults, Question, submitExamAnswers } from '@/services/examsService';

export default function ExamPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingResult, setExistingResult] = useState<{ percentage: number; isPassed: boolean } | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getExamById(id), getExamQuestions(id)]).then(async ([examData, questionData]) => {
      setExam(examData); setQuestions(questionData); setTimeLeft((examData.timeLimitMin || 0) * 60);
      try { const result = await getExamResults(id); setExistingResult(result); } catch { /* first attempt */ }
    }).catch((requestError: any) => setError(requestError.response?.data?.message || 'الامتحان غير متاح حاليًا.')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!timeLeft || existingResult || submitting) return;
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft, existingResult, submitting]);

  const currentQuestion = questions[current];
  const answerCount = Object.keys(answers).length;
  const isLast = current === questions.length - 1;
  const formattedTime = useMemo(() => `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`, [timeLeft]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!id || !exam || submitting) return;
    setSubmitting(true); setError('');
    const payload: Answer[] = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
    try {
      await submitExamAnswers(id, payload);
      navigate(`/exams/${id}/result`, { replace: true, state: { answers } });
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'تعذر تسليم الامتحان. حاول مرة أخرى.');
      setSubmitting(false);
    }
  };

  if (loading) return <AppShell><div className="loading-panel"><span className="spinner" /> جارٍ تجهيز الامتحان...</div></AppShell>;
  if (error || !exam) return <AppShell><div className="error-state"><ShieldAlert size={28} /><h1>لا يمكن فتح الامتحان</h1><p>{error || 'الامتحان غير موجود.'}</p><button type="button" className="outline-button" onClick={() => navigate('/exams')}>العودة للامتحانات</button></div></AppShell>;
  if (existingResult?.isPassed) return <AppShell><div className="result-locked"><span className="result-seal"><CheckCircle2 size={32} /></span><span className="eyebrow">تم الحل من قبل</span><h1>أحسنت، لقد اجتزت الامتحان</h1><p>نتيجتك {Math.round(existingResult.percentage)}٪. يمكنك مراجعة الإجابات دون إعادة المحاولة.</p><div className="result-actions"><button type="button" className="primary-button" onClick={() => navigate(`/exams/${id}/result`)}>عرض النتيجة</button><button type="button" className="quiet-button" onClick={() => navigate('/exams')}>العودة</button></div></div></AppShell>;
  if (!currentQuestion) return <AppShell><div className="empty-state"><FileText size={26} /><h2>الامتحان لم يجهز بأسئلة بعد</h2><p>سيظهر هنا فور إضافة أسئلة من المدرس.</p><button type="button" className="outline-button" onClick={() => navigate('/exams')}>العودة</button></div></AppShell>;

  return <AppShell><form className="exam-player page-stack" onSubmit={submit}><button className="back-link" type="button" onClick={() => navigate('/exams')}><ArrowRight size={17} /> الخروج للامتحانات</button><section className="exam-player-head"><div><span className="eyebrow">{exam.type === 'general' ? 'امتحان عام' : 'امتحان باب'}</span><h1>{exam.title}</h1><p>السؤال {current + 1} من {questions.length}</p></div>{exam.timeLimitMin > 0 && <div className={`timer-chip ${timeLeft < 120 ? 'is-warning' : ''}`}><Clock3 size={17} /> {formattedTime}</div>}</section><div className="exam-progress"><span style={{ transform: `scaleX(${(current + 1) / questions.length})` }} /></div><section className="question-card"><div className="question-number">سؤال {String(current + 1).padStart(2, '0')}</div><h2>{currentQuestion.content}</h2><div className="answer-options">{currentQuestion.options.map((option) => <label className={`answer-option ${answers[currentQuestion._id] === option.id ? 'is-selected' : ''}`} key={option.id}><input type="radio" name={currentQuestion._id} value={option.id} checked={answers[currentQuestion._id] === option.id} onChange={() => setAnswers((value) => ({ ...value, [currentQuestion._id]: option.id }))} /><span className="fake-radio" /><span>{option.text}</span></label>)}</div></section>{error && <div className="form-error" role="alert">{error}</div>}<div className="exam-navigation"><button className="quiet-button" type="button" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}><ChevronRight size={17} /> السابق</button><span>{answerCount} / {questions.length} تمت الإجابة</span>{isLast ? <button className="primary-button" type="submit" disabled={submitting}>{submitting ? <span className="spinner spinner-light" /> : <Send size={16} />} {submitting ? 'جارٍ التصحيح...' : 'تسليم الامتحان'}</button> : <button className="primary-button" type="button" onClick={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))}>التالي <ChevronLeft size={17} /></button>}</div></form></AppShell>;
}
