import { FormEvent, useEffect, useState } from 'react';
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, FileText, Plus, RefreshCw, Search, Shuffle, X } from 'lucide-react';
import { useLocation, useNavigate } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { Course, getCourses } from '@/services/coursesService';
import { EducationalLevel, getEducationalLevels } from '@/services/educationalLevelService';
import { createExam, Exam, getAllExams } from '@/services/examsService';

const blank = { title: '', type: 'general' as 'general' | 'course', courseId: '', educationalLevel: '', timeLimitMin: '0', maxAttempts: '1', reviewMode: 'closed' as 'closed' | 'open' | 'scheduled', reviewReleaseAt: '', date: '', mandatoryAttendance: false, shuffleQuestions: false, shuffleOptions: false, isActive: true };

export default function ManageExamsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryCourse = new URLSearchParams(location.search).get('courseId') || '';
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [scope, setScope] = useState<'all' | 'general' | 'course'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number; hasPrevPage: boolean; hasNextPage: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ ...blank, courseId: queryCourse });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getAllExams({ page, limit: 12, search: search.trim() || undefined, type: scope === 'all' ? undefined : scope, courseId: queryCourse || undefined }), getCourses({ limit: 100 }), getEducationalLevels()])
      .then(([examData, courseData, levelData]) => { setExams(examData.exams); setPagination(examData.pagination); setCourses(courseData.courses); setLevels(levelData.data); })
      .catch(() => setError('تعذر تحميل الامتحانات.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { const timer = window.setTimeout(() => load(), search ? 350 : 0); return () => window.clearTimeout(timer); }, [page, scope, queryCourse, search]);
  useEffect(() => { setPage(1); }, [scope, queryCourse, search]);

  const openCreate = () => { setForm({ ...blank, courseId: queryCourse, educationalLevel: levels[0]?._id || '' }); setDialog(true); setError(''); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || (form.type === 'general' ? !form.educationalLevel : !form.courseId)) { setError('أكمل اسم الامتحان واختَر الصف أو الباب.'); return; }
    if (form.reviewMode === 'scheduled' && !form.reviewReleaseAt) { setError('حدد موعد فتح المراجعة.'); return; }
    setSaving(true);
    setError('');
    try {
      await createExam({
        title: form.title.trim(), type: form.type,
        courseId: form.type === 'course' ? form.courseId : undefined,
        educationalLevel: form.type === 'general' ? form.educationalLevel : undefined,
        timeLimitMin: Number(form.timeLimitMin) || 0,
        maxAttempts: Math.max(1, Number(form.maxAttempts) || 1),
        reviewMode: form.reviewMode,
        reviewReleaseAt: form.reviewMode === 'scheduled' ? new Date(form.reviewReleaseAt).toISOString() : null,
        date: form.date ? new Date(form.date).toISOString() : null,
        mandatoryAttendance: form.mandatoryAttendance,
        shuffleQuestions: form.shuffleQuestions,
        shuffleOptions: form.shuffleOptions,
        isActive: form.isActive
      });
      setDialog(false);
      load();
    } catch (requestError: any) { setError(requestError.response?.data?.message || 'تعذر إنشاء الامتحان.'); }
    finally { setSaving(false); }
  };

  return <AppShell><div className="admin-page-stack"><section className="admin-page-intro"><div><span className="admin-eyebrow">قياس الفهم</span><h1>الامتحانات</h1><p>أنشئ امتحانًا عامًا للصف أو امتحانًا خاصًا بأي باب.</p></div><button type="button" className="admin-primary" onClick={openCreate}><Plus size={17} /> امتحان جديد</button></section><div className="admin-toolbar"><div className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم الامتحان" /></div><div className="admin-filter-tabs"><button type="button" className={scope === 'all' ? 'is-active' : ''} onClick={() => setScope('all')}>الكل</button><button type="button" className={scope === 'general' ? 'is-active' : ''} onClick={() => setScope('general')}>عامة</button><button type="button" className={scope === 'course' ? 'is-active' : ''} onClick={() => setScope('course')}>الأبواب</button></div></div>{queryCourse && <div className="admin-filter-context"><BookOpen size={15} /> تعرض امتحانات الباب المحدد فقط <button type="button" onClick={() => navigate('/exams/manage')}>إلغاء الفلتر</button></div>}{error && <div className="admin-error" role="alert">{error}<button type="button" onClick={() => { setError(''); load(); }}><RefreshCw size={14} /> إعادة المحاولة</button></div>}{loading ? <div className="admin-loading-panel"><span className="spinner" /> جارٍ تحميل الامتحانات...</div> : exams.length === 0 ? <div className="admin-empty"><ClipboardList size={25} /><h2>لا توجد امتحانات</h2><p>أضف أول امتحان للطلاب.</p><button type="button" className="admin-secondary" onClick={openCreate}><Plus size={15} /> إضافة امتحان</button></div> : <><div className="admin-exam-table"><div className="admin-table-head"><span>الامتحان</span><span>النوع</span><span>الارتباط</span><span>الإعدادات</span><span>إجراء</span></div>{exams.map((exam) => <article className="admin-exam-table-row" key={exam._id}><span className="admin-course-title"><span className="exam-table-icon"><FileText size={16} /></span><span><strong>{exam.title}</strong><small>{exam.timeLimitMin ? `${exam.timeLimitMin} دقيقة` : 'بدون وقت محدد'} · {exam.totalMarks || 0} درجات</small></span></span><span className={exam.type === 'general' ? 'admin-term-pill lilac-pill' : 'admin-term-pill'}>{exam.type === 'general' ? 'عام' : 'باب'}</span><span className="admin-muted">{exam.type === 'general' ? typeof exam.educationalLevel === 'object' ? exam.educationalLevel.nameAr : 'صف دراسي' : typeof exam.courseId === 'object' ? exam.courseId.title : 'باب'}</span><span className="admin-muted">{exam.maxAttempts || 1} محاولات · {exam.reviewMode === 'open' ? 'مراجعة مفتوحة' : exam.reviewMode === 'scheduled' ? 'مراجعة مجدولة' : 'مراجعة مغلقة'}</span><span className="row-actions"><button type="button" className="row-open" onClick={() => navigate(`/admin/exams/${exam._id}`)}>إدارة <ChevronLeft size={14} /></button></span></article>)}</div>{pagination && pagination.totalPages > 1 && <div className="pagination-controls"><button type="button" onClick={() => setPage((value) => value - 1)} disabled={!pagination.hasPrevPage}><ChevronRight size={15} /> السابق</button><span>صفحة {pagination.currentPage} من {pagination.totalPages} · {pagination.totalItems} امتحان</span><button type="button" onClick={() => setPage((value) => value + 1)} disabled={!pagination.hasNextPage}>التالي <ChevronLeft size={15} /></button></div>}</>}{dialog && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(false); }}><div className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="exam-dialog-title"><div className="admin-dialog-head"><div><span className="admin-eyebrow">امتحان جديد</span><h2 id="exam-dialog-title">إضافة امتحان</h2></div><button type="button" onClick={() => setDialog(false)} aria-label="إغلاق"><X size={18} /></button></div><form className="admin-form" onSubmit={submit}><label>اسم الامتحان<input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="مثال: اختبار الباب الأول" /></label><label>نوع الامتحان<span className="admin-select full-select"><select value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value as any, courseId: '', educationalLevel: '' }))}><option value="general">امتحان عام للصف</option><option value="course">امتحان باب</option></select><ChevronDown size={15} /></span></label>{form.type === 'general' ? <label>الصف الدراسي<span className="admin-select full-select"><select value={form.educationalLevel} onChange={(event) => setForm((value) => ({ ...value, educationalLevel: event.target.value }))}><option value="">اختر الصف</option>{levels.map((level) => <option key={level._id} value={level._id}>{level.nameAr}</option>)}</select><ChevronDown size={15} /></span></label> : <label>الباب<span className="admin-select full-select"><select value={form.courseId} onChange={(event) => setForm((value) => ({ ...value, courseId: event.target.value }))}><option value="">اختر الباب</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title} · {course.educationalLevel?.nameAr}</option>)}</select><ChevronDown size={15} /></span></label>}<div className="admin-form-grid"><label>المدة بالدقائق<input type="number" min="0" value={form.timeLimitMin} onChange={(event) => setForm((value) => ({ ...value, timeLimitMin: event.target.value }))} /></label><label>أقصى عدد للمحاولات<input type="number" min="1" value={form.maxAttempts} onChange={(event) => setForm((value) => ({ ...value, maxAttempts: event.target.value }))} /></label><label>موعد الامتحان<input type="datetime-local" value={form.date} onChange={(event) => setForm((value) => ({ ...value, date: event.target.value }))} /></label></div><label>مراجعة الإجابات<span className="admin-select full-select"><select value={form.reviewMode} onChange={(event) => setForm((value) => ({ ...value, reviewMode: event.target.value as any }))}><option value="closed">مغلقة</option><option value="open">مفتوحة الآن</option><option value="scheduled">فتح تلقائيًا في موعد</option></select><ChevronDown size={15} /></span></label>{form.reviewMode === 'scheduled' && <label>موعد فتح المراجعة<input type="datetime-local" value={form.reviewReleaseAt} onChange={(event) => setForm((value) => ({ ...value, reviewReleaseAt: event.target.value }))} /></label>}<div className="admin-check-grid"><label className="admin-check-row"><input type="checkbox" checked={form.mandatoryAttendance} onChange={(event) => setForm((value) => ({ ...value, mandatoryAttendance: event.target.checked }))} /><span>حضور إلزامي</span></label><label className="admin-check-row"><input type="checkbox" checked={form.shuffleQuestions} onChange={(event) => setForm((value) => ({ ...value, shuffleQuestions: event.target.checked }))} /><Shuffle size={15} /><span>تغيير ترتيب الأسئلة</span></label><label className="admin-check-row"><input type="checkbox" checked={form.shuffleOptions} onChange={(event) => setForm((value) => ({ ...value, shuffleOptions: event.target.checked }))} /><Shuffle size={15} /><span>تغيير ترتيب الاختيارات</span></label></div><button type="submit" className="admin-primary full-admin-button" disabled={saving}>{saving ? <><span className="spinner spinner-light" /> جارٍ الحفظ...</> : <><Plus size={16} /> إنشاء الامتحان</>}</button></form></div></div>}</div></AppShell>;
}
