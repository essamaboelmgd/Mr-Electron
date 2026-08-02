import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, Send, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import {
  Answer,
  Exam,
  ExamAttempt,
  ExamPolicy,
  ExamResult,
  getExamById,
  getExamQuestions,
  getExamResults,
  Question,
  saveExamAttempt,
  startExamAttempt,
  submitExamAttempt
} from '@/services/examsService';

const answersToMap = (answers: Answer[] = []) => answers.reduce<Record<string, string>>((map, answer) => {
  map[String(answer.questionId)] = answer.selectedOption;
  return map;
}, {});

export default function ExamPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [policy, setPolicy] = useState<ExamPolicy | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingResult, setExistingResult] = useState<ExamResult | null>(null);
  const autoSubmitted = useRef(false);

  const answersPayload = useMemo<Answer[]>(() => Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption })), [answers]);

  const submit = async (isTimeout = false) => {
    if (!id || !attempt || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await submitExamAttempt(id, attempt._id, answersPayload);
      navigate(`/exams/${id}/result?attemptId=${attempt._id}`, { replace: true });
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || (isTimeout ? 'تعذر تسليم الامتحان بعد انتهاء الوقت.' : 'تعذر تسليم الامتحان. حاول مرة أخرى.'));
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!id) return undefined;
    const load = async () => {
      try {
        const examData = await getExamById(id);
        if (cancelled) return;
        setExam(examData);
        const questionData = await getExamQuestions(id);
        if (cancelled) return;
        setQuestions(questionData);
        const started = await startExamAttempt(id);
        if (cancelled) return;
        setAttempt(started.attempt);
        setPolicy(started.policy);
        setAnswers(answersToMap(started.attempt.answers));
        setCurrent(Math.min(started.attempt.currentQuestion || 0, Math.max(questionData.length - 1, 0)));
        setTimeLeft(started.attempt.remainingSeconds || 0);
      } catch (requestError: any) {
        try {
          const result = await getExamResults(id);
          if (!cancelled) {
            setExistingResult(result);
            setPolicy(result.policy || null);
          }
        } catch {
          if (!cancelled) setError(requestError.response?.data?.message || 'الامتحان غير متاح حاليًا.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!attempt || !id || submitting) return undefined;
    const timer = window.setInterval(() => {
      const seconds = attempt.expiresAt
        ? Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000))
        : 0;
      setTimeLeft(seconds);
      if (attempt.expiresAt && seconds <= 0 && !autoSubmitted.current) {
        autoSubmitted.current = true;
        void submit(true);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [attempt, id, submitting, answersPayload]);

  useEffect(() => {
    if (!attempt || !id || loading || submitting) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        const saved = await saveExamAttempt(id, attempt._id, answersPayload, current);
        setAttempt((value) => value ? { ...value, ...saved, answers: answersPayload, currentQuestion: current } : value);
      } catch {
        // The final submit remains the source of truth if an autosave request is interrupted.
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [answersPayload, attempt?._id, current, id, loading, submitting]);

  const currentQuestion = questions[current];
  const answerCount = Object.keys(answers).length;
  const isLast = current === questions.length - 1;
  const formattedTime = useMemo(() => `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`, [timeLeft]);

  if (loading) return <AppShell><div className="loading-panel"><span className="spinner" /> جارٍ تجهيز الامتحان...</div></AppShell>;
  if (error || !exam) return <AppShell><div className="error-state"><ShieldAlert size={28} /><h1>لا يمكن فتح الامتحان</h1><p>{error || 'الامتحان غير موجود.'}</p><button type="button" className="outline-button" onClick={() => navigate('/exams')}>العودة للامتحانات</button></div></AppShell>;
  if (existingResult && !attempt) return <AppShell><div className="result-locked"><span className="result-seal"><CheckCircle2 size={32} /></span><span className="eyebrow">لا توجد محاولة جديدة</span><h1>وصلت للحد المسموح من المحاولات</h1><p>آخر نتيجة لك {Math.round(existingResult.percentage)}٪. يمكنك العودة للنتيجة أو مراجعة الإجابات إذا فتحها المدرس.</p><div className="result-actions"><button type="button" className="primary-button" onClick={() => navigate(`/exams/${id}/result?attemptId=${existingResult.submission._id}`)}>عرض النتيجة</button><button type="button" className="quiet-button" onClick={() => navigate('/exams')}>العودة</button></div></div></AppShell>;
  if (!currentQuestion || !attempt) return <AppShell><div className="empty-state"><FileText size={26} /><h2>الامتحان لم يجهز بأسئلة بعد</h2><p>سيظهر هنا فور إضافة أسئلة من المدرس.</p><button type="button" className="outline-button" onClick={() => navigate('/exams')}>العودة</button></div></AppShell>;

  return (
    <AppShell>
      <div className="exam-player page-stack">
        <div className="exam-topline">
          <button className="back-link" type="button" onClick={() => navigate('/exams')}><ArrowRight size={17} /> الخروج للامتحانات</button>
          <span className="exam-mode-label"><FileText size={14} /> {exam.type === 'general' ? 'امتحان عام' : 'امتحان باب'}</span>
        </div>

        <section className="exam-player-head">
          <div className="exam-title-block">
            <span className="eyebrow">أنت في وضع التركيز</span>
            <h1>{exam.title}</h1>
            <p>المحاولة {attempt.attemptNumber} · السؤال {current + 1} من {questions.length}</p>
          </div>
          <div className="exam-status-cluster">
            {exam.timeLimitMin > 0 && <div className={`timer-chip ${timeLeft < 120 ? 'is-warning' : ''}`}><Clock3 size={17} /><span><small>الوقت المتبقي</small><strong>{formattedTime}</strong></span></div>}
            <div className="exam-progress-stat"><span>الإجابات</span><strong>{answerCount}<small>/{questions.length}</small></strong></div>
          </div>
        </section>

        <section className="exam-progress-panel" aria-label="تقدم الامتحان">
          <div className="exam-progress-label"><span>تقدمك في الامتحان</span><strong>{Math.round(((current + 1) / questions.length) * 100)}٪</strong></div>
          <div className="exam-progress"><span style={{ transform: `scaleX(${(current + 1) / questions.length})` }} /></div>
        </section>

        <section className="question-card">
          <div className="question-card-head">
            <div className="question-number"><span>سؤال</span><strong>{String(current + 1).padStart(2, '0')}</strong></div>
            <span className="question-marks">{currentQuestion.marks || 1} {currentQuestion.marks === 1 ? 'درجة' : 'درجات'}</span>
          </div>
          <div className="question-card-body">
            <h2>{currentQuestion.content}</h2>
            <div className="answer-options" role="radiogroup" aria-label="اختيارات السؤال">
              {currentQuestion.options.map((option) => <label className={`answer-option ${answers[currentQuestion._id] === option.id ? 'is-selected' : ''}`} key={option.id}>
                <input type="radio" name={currentQuestion._id} value={option.id} checked={answers[currentQuestion._id] === option.id} onChange={() => setAnswers((value) => ({ ...value, [currentQuestion._id]: option.id }))} />
                <span className="answer-option-key">{option.id.toUpperCase()}</span>
                <span>{option.text}</span>
              </label>)}
            </div>
          </div>
        </section>

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="exam-navigation">
          <button className="quiet-button" type="button" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}><ChevronRight size={17} /> السابق</button>
          <div className="exam-nav-center"><strong>السؤال {current + 1} من {questions.length}</strong><span>{answerCount} تمت الإجابة</span></div>
          {isLast ? <button className="primary-button" type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? <span className="spinner spinner-light" /> : <Send size={16} />} {submitting ? 'جارٍ التصحيح...' : 'تسليم الامتحان'}</button> : <button className="primary-button" type="button" onClick={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))}>التالي <ChevronLeft size={17} /></button>}
        </div>
        {policy?.maxAttempts && policy.maxAttempts > 1 && <p className="exam-policy-note">متاح لك حتى {policy.maxAttempts} محاولات لهذا الامتحان.</p>}
      </div>
    </AppShell>
  );
}
