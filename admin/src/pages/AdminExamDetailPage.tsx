import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, ChevronDown, Edit3, FileText, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Exam, getExamById, getExamQuestions, Question, createQuestion, deleteQuestion, updateExam, updateQuestion } from '@/services/examsService';

const blankQuestion = { content: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'a', explanation: '', marks: '1', order: '1' };

export default function AdminExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingExam, setEditingExam] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState('0');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [reviewMode, setReviewMode] = useState<Exam['reviewMode']>('closed');
  const [reviewReleaseAt, setReviewReleaseAt] = useState('');
  const [questionDialog, setQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [question, setQuestion] = useState(blankQuestion);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([getExamById(id), getExamQuestions(id)])
      .then(([examData, questionData]) => {
        setExam(examData);
        setExamTitle(examData.title);
        setTimeLimit(String(examData.timeLimitMin || 0));
        setMaxAttempts(String(examData.maxAttempts || 1));
        setReviewMode(examData.reviewMode || 'closed');
        setReviewReleaseAt(toDatetimeLocal(examData.reviewReleaseAt));
        setQuestions(questionData);
      })
      .catch((requestError: any) => setError(requestError.response?.data?.message || 'تعذر تحميل الامتحان.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const saveExam = async () => {
    if (!id || !examTitle.trim()) return;
    if (reviewMode === 'scheduled' && !reviewReleaseAt) {
      setError('حدد موعد فتح المراجعة.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await updateExam(id, {
        title: examTitle.trim(),
        timeLimitMin: Number(timeLimit) || 0,
        maxAttempts: Math.max(1, Number(maxAttempts) || 1),
        reviewMode,
        reviewReleaseAt: reviewMode === 'scheduled' ? new Date(reviewReleaseAt).toISOString() : null
      });
      setExam(updated);
      setEditingExam(false);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'تعذر حفظ بيانات الامتحان.');
    } finally {
      setSaving(false);
    }
  };

  const openQuestion = (item?: Question) => {
    if (!item) {
      setEditingQuestion(null);
      setQuestion({ ...blankQuestion, order: String(questions.length + 1) });
    } else {
      const options = item.options || [];
      setEditingQuestion(item);
      setQuestion({
        content: item.content,
        optionA: options.find((option) => option.id === 'a')?.text || '',
        optionB: options.find((option) => option.id === 'b')?.text || '',
        optionC: options.find((option) => option.id === 'c')?.text || '',
        optionD: options.find((option) => option.id === 'd')?.text || '',
        correct: item.correct,
        explanation: item.explanation || '',
        marks: String(item.marks || 1),
        order: String(item.order || 1)
      });
    }
    setQuestionDialog(true);
    setError('');
  };

  const saveQuestion = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !question.content.trim() || !question.optionA.trim() || !question.optionB.trim()) {
      setError('نص السؤال وأول اختيارين مطلوبان.');
      return;
    }
    setSaving(true);
    setError('');
    const payload: any = {
      examId: id,
      content: question.content.trim(),
      options: [
        { id: 'a', text: question.optionA.trim() },
        { id: 'b', text: question.optionB.trim() },
        ...(question.optionC.trim() ? [{ id: 'c', text: question.optionC.trim() }] : []),
        ...(question.optionD.trim() ? [{ id: 'd', text: question.optionD.trim() }] : [])
      ],
      correct: question.correct,
      explanation: question.explanation.trim(),
      marks: Number(question.marks) || 1,
      order: Number(question.order) || 1
    };
    try {
      if (editingQuestion) await updateQuestion(editingQuestion._id, payload);
      else await createQuestion(payload);
      setQuestionDialog(false);
      load();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'تعذر حفظ السؤال.');
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (item: Question) => {
    if (!window.confirm('حذف هذا السؤال؟')) return;
    try { await deleteQuestion(item._id); load(); } catch { setError('تعذر حذف السؤال.'); }
  };

  if (loading) return <AppShell><div className="admin-loading-panel"><span className="spinner" /> جارٍ تحميل الامتحان...</div></AppShell>;
  if (!exam) return <AppShell><div className="admin-empty"><FileText size={25} /><h2>الامتحان غير موجود</h2><button type="button" className="admin-secondary" onClick={() => navigate('/exams/manage')}>العودة</button></div></AppShell>;

  return <AppShell><div className="admin-page-stack">
    <button type="button" className="admin-back-link" onClick={() => navigate('/exams/manage')}><ArrowRight size={17} /> العودة للامتحانات</button>
    <section className="admin-chapter-hero exam-detail-hero"><div>
      <span className="admin-eyebrow">{exam.type === 'general' ? 'امتحان عام' : 'امتحان باب'}</span>
      {editingExam ? <div className="admin-inline-edit"><input value={examTitle} onChange={(event) => setExamTitle(event.target.value)} /><button type="button" className="admin-primary" onClick={saveExam} disabled={saving}><Check size={15} /> حفظ</button><button type="button" className="admin-secondary" onClick={() => setEditingExam(false)}>إلغاء</button></div> : <h1>{exam.title}</h1>}
      <p>{exam.timeLimitMin ? `${exam.timeLimitMin} دقيقة` : 'بدون وقت محدد'} · {exam.totalMarks || 0} درجات · {questions.length} أسئلة · {exam.maxAttempts || 1} محاولات</p>
    </div><div className="hero-actions"><button type="button" className="admin-secondary" onClick={() => setEditingExam(true)}><Edit3 size={15} /> تعديل البيانات</button><button type="button" className="admin-primary" onClick={() => navigate(`/admin/exams/${id}/results`)}><CheckCircle2 size={15} /> النتائج</button></div></section>
    {error && <div className="admin-error" role="alert">{error}<button type="button" onClick={() => { setError(''); load(); }}><RefreshCw size={14} /> إعادة المحاولة</button></div>}
    <section className="admin-panel exam-policy-panel"><div className="admin-section-heading"><div><span className="admin-eyebrow">سياسة الامتحان</span><h2>المحاولات والمراجعة</h2></div><span className="policy-state">{exam.reviewMode === 'open' ? 'المراجعة مفتوحة' : exam.reviewMode === 'scheduled' ? `تفتح ${toReadableDate(exam.reviewReleaseAt)}` : 'المراجعة مغلقة'}</span></div><div className="admin-form-grid"><label>أقصى عدد للمحاولات<input type="number" min="1" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} /></label><label>مراجعة الإجابات<span className="admin-select full-select"><select value={reviewMode} onChange={(event) => setReviewMode(event.target.value as Exam['reviewMode'])}><option value="closed">مغلقة</option><option value="open">مفتوحة الآن</option><option value="scheduled">فتح تلقائيًا في موعد</option></select><ChevronDown size={15} /></span></label>{reviewMode === 'scheduled' && <label>موعد فتح المراجعة<input type="datetime-local" value={reviewReleaseAt} onChange={(event) => setReviewReleaseAt(event.target.value)} /></label>}</div><p className="admin-form-hint">يمكنك غلق المراجعة مرة أخرى بعد فتحها، وتظل درجات الطلاب محفوظة في كل الحالات.</p><button type="button" className="admin-primary" onClick={saveExam} disabled={saving}><Check size={15} /> حفظ سياسة الامتحان</button></section>
    <section className="admin-panel"><div className="admin-section-heading"><div><span className="admin-eyebrow">بنك الأسئلة</span><h2>أسئلة الامتحان</h2></div><button type="button" className="admin-primary" onClick={() => openQuestion()}><Plus size={16} /> إضافة سؤال</button></div><div className="admin-question-list">{questions.length === 0 ? <div className="admin-empty-mini"><FileText size={20} /><p>أضف سؤالًا واحدًا على الأقل ليصبح الامتحان جاهزًا.</p></div> : questions.map((item, index) => <article className="admin-question-row" key={item._id}><span className="question-order">{String(index + 1).padStart(2, '0')}</span><div><strong>{item.content}</strong><small>{item.options.length} اختيارات · {item.marks} درجة</small></div><span className="admin-question-actions"><button type="button" onClick={() => openQuestion(item)} aria-label="تعديل السؤال"><Edit3 size={15} /></button><button type="button" onClick={() => removeQuestion(item)} aria-label="حذف السؤال"><Trash2 size={15} /></button></span></article>)}</div></section>
    {questionDialog && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuestionDialog(false); }}><div className="admin-dialog question-dialog" role="dialog" aria-modal="true" aria-labelledby="question-dialog-title"><div className="admin-dialog-head"><div><span className="admin-eyebrow">{editingQuestion ? 'تعديل السؤال' : 'سؤال جديد'}</span><h2 id="question-dialog-title">{editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال'}</h2></div><button type="button" onClick={() => setQuestionDialog(false)} aria-label="إغلاق"><X size={18} /></button></div><form className="admin-form" onSubmit={saveQuestion}><label>نص السؤال<textarea rows={3} value={question.content} onChange={(event) => setQuestion((value) => ({ ...value, content: event.target.value }))} /></label><div className="admin-form-grid"><label>الاختيار أ<input value={question.optionA} onChange={(event) => setQuestion((value) => ({ ...value, optionA: event.target.value }))} /></label><label>الاختيار ب<input value={question.optionB} onChange={(event) => setQuestion((value) => ({ ...value, optionB: event.target.value }))} /></label><label>الاختيار ج<input value={question.optionC} onChange={(event) => setQuestion((value) => ({ ...value, optionC: event.target.value }))} /></label><label>الاختيار د<input value={question.optionD} onChange={(event) => setQuestion((value) => ({ ...value, optionD: event.target.value }))} /></label></div><div className="admin-form-grid"><label>الإجابة الصحيحة<span className="admin-select full-select"><select value={question.correct} onChange={(event) => setQuestion((value) => ({ ...value, correct: event.target.value }))}><option value="a">أ</option><option value="b">ب</option><option value="c">ج</option><option value="d">د</option></select><ChevronDown size={15} /></span></label><label>الدرجة<input type="number" min="1" value={question.marks} onChange={(event) => setQuestion((value) => ({ ...value, marks: event.target.value }))} /></label></div><label>شرح الإجابة<textarea rows={2} value={question.explanation} onChange={(event) => setQuestion((value) => ({ ...value, explanation: event.target.value }))} /></label><button type="submit" className="admin-primary full-admin-button" disabled={saving}>{saving ? <><span className="spinner spinner-light" /> جارٍ الحفظ...</> : <><Check size={16} /> حفظ السؤال</>}</button></form></div></div>}
  </div></AppShell>;
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toReadableDate(value?: string | null) {
  if (!value) return 'بدون موعد';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'بدون موعد' : date.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
}
