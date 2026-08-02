import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, Clock3, Edit3, ExternalLink, FileText, Link2, Plus, RefreshCw, Trash2, Video, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { completeBunnyUpload, Course, CourseExam, createBunnyUploadSession, createLesson, deleteLesson, getCourseById, getCourseExams, getCourseLessons, Lesson, uploadFileToBunny, updateLesson } from '@/services/coursesService';

type Provider = 'bunny' | 'youtube' | 'vimeo';
type LessonForm = { title: string; duration: string; description: string; order: string; provider: Provider; videoUrl: string; videoFile: File | null };

const blankLesson: LessonForm = { title: '', duration: '0', description: '', order: '0', provider: 'bunny', videoUrl: '', videoFile: null };
const requestMessage = (error: unknown, fallback: string) => {
  const typed = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const message = typed.response?.data?.message || typed.message;
  return Array.isArray(message) ? message.join('، ') : message || fallback;
};

export default function AdminCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<CourseExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState<LessonForm>(blankLesson);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([getCourseById(id), getCourseLessons(id), getCourseExams(id)])
      .then(([chapter, chapterLessons, chapterExams]) => { setCourse(chapter); setLessons(chapterLessons); setExams(chapterExams); })
      .catch((requestError: unknown) => setError(requestMessage(requestError, 'تعذر تحميل الباب.')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const openCreate = () => { setEditing(null); setForm({ ...blankLesson, order: String(lessons.length + 1) }); setDialog(true); setError(''); setUploadProgress(0); };
  const openEdit = (lesson: Lesson) => {
    setEditing(lesson);
    setForm({
      title: lesson.title,
      duration: String(lesson.duration || 0),
      description: lesson.description || '',
      order: String(lesson.order || 0),
      provider: lesson.videoProvider || 'bunny',
      videoUrl: lesson.videoUrl || '',
      videoFile: null
    });
    setDialog(true); setError(''); setUploadProgress(0);
  };

  const updateField = <K extends keyof LessonForm>(field: K, value: LessonForm[K]) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !form.title.trim()) { setError('عنوان الدرس مطلوب.'); return; }
    if (form.provider === 'bunny' && !form.videoFile && !(editing?.videoProvider === 'bunny' && editing.videoId)) { setError('اختر ملف فيديو لرفعه إلى Bunny.'); return; }
    if (form.provider !== 'bunny' && !form.videoUrl.trim()) { setError('رابط الفيديو مطلوب.'); return; }

    setSaving(true); setError(''); setUploadProgress(0);
    const details = { title: form.title.trim(), duration: Number(form.duration) || 0, description: form.description.trim(), order: Number(form.order) || 0 };
    try {
      let lesson = editing;
      if (form.provider === 'bunny' && form.videoFile) {
        // A new lesson is created as a draft before the direct browser upload.
        if (!lesson) {
          lesson = await createLesson({ courseId: id, ...details });
          setEditing(lesson);
        }
        const upload = await createBunnyUploadSession(form.videoFile.name || form.title);
        await uploadFileToBunny(upload, form.videoFile, setUploadProgress);
        await completeBunnyUpload(lesson._id, upload.videoId);
      } else if (lesson) {
        await updateLesson(lesson._id, { ...details, videoUrl: form.videoUrl.trim() || undefined, videoProvider: form.provider, ...(form.provider === 'bunny' && lesson.videoId ? { videoId: lesson.videoId } : {}) });
      } else {
        await createLesson({ courseId: id, ...details, videoUrl: form.videoUrl.trim(), videoProvider: form.provider });
      }
      setDialog(false); load();
    } catch (requestError: unknown) {
      setError(requestMessage(requestError, 'تعذر حفظ الدرس.'));
    } finally { setSaving(false); }
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => updateField('videoFile', event.target.files?.[0] || null);
  const removeLesson = async (lesson: Lesson) => { if (!window.confirm(`حذف الدرس «${lesson.title}»؟`)) return; try { await deleteLesson(lesson._id); load(); } catch { setError('تعذر حذف الدرس.'); } };

  if (loading) return <AppShell><div className="admin-loading-panel"><span className="spinner" /> جارٍ تحميل الباب...</div></AppShell>;
  if (!course) return <AppShell><div className="admin-empty"><RefreshCw size={24} /><h2>الباب غير موجود</h2><button type="button" className="admin-secondary" onClick={() => navigate('/curriculum')}>العودة للمنهج</button></div></AppShell>;

  return <AppShell>
    <div className="admin-page-stack">
      <button className="admin-back-link" type="button" onClick={() => navigate('/curriculum')}><ArrowRight size={17} /> العودة للأبواب</button>
      <section className="admin-chapter-hero"><div><span className="admin-eyebrow">{course.term === 'first' ? 'الترم الأول' : 'الترم الثاني'} · {course.educationalLevel?.nameAr}</span><h1>{course.title}</h1><p>{course.description || 'أضف وصفًا يساعد الطالب على معرفة محتوى الباب.'}</p></div><span className={course.isActive ? 'admin-status open large-status' : 'admin-status closed large-status'}>{course.isActive ? <><Check size={14} /> منشور</> : 'مخفي'}</span></section>
      {error && <div className="admin-error" role="alert">{error}<button type="button" onClick={() => { setError(''); load(); }}><RefreshCw size={14} /> إعادة المحاولة</button></div>}
      <div className="admin-detail-grid">
        <section className="admin-panel"><div className="admin-section-heading"><div><span className="admin-eyebrow">محتوى الباب</span><h2>الدروس</h2></div><button type="button" className="admin-primary" onClick={openCreate}><Plus size={16} /> إضافة درس</button></div>
          <div className="admin-lesson-list">{lessons.length === 0 ? <div className="admin-empty-mini">لم تضف دروسًا لهذا الباب بعد.</div> : lessons.map((lesson, index) => <article className="admin-lesson-row" key={lesson._id}><span className="admin-lesson-number">{String(index + 1).padStart(2, '0')}</span><span className="admin-lesson-copy"><strong>{lesson.title}</strong><small><Clock3 size={12} /> {lesson.duration || 0} دقيقة · <Video size={12} /> {lesson.videoProvider === 'vimeo' ? 'Vimeo' : lesson.videoProvider === 'bunny' ? 'Bunny' : 'YouTube'} {lesson.videoStatus === 'processing' ? '· قيد المعالجة' : ''}</small></span><span className="admin-lesson-actions"><button type="button" aria-label="تعديل الدرس" onClick={() => openEdit(lesson)}><Edit3 size={15} /></button><button type="button" aria-label="حذف الدرس" onClick={() => removeLesson(lesson)}><Trash2 size={15} /></button></span></article>)}</div>
        </section>
        <aside className="admin-panel admin-exam-panel"><div className="admin-section-heading"><div><span className="admin-eyebrow">اختبارات الفهم</span><h2>امتحانات الباب</h2></div><button type="button" className="admin-icon-button" onClick={() => navigate(`/exams/manage?courseId=${id}`)} aria-label="إضافة امتحان"><Plus size={16} /></button></div>{exams.length === 0 ? <div className="admin-empty-mini"><FileText size={20} /><p>لا يوجد امتحان لهذا الباب.</p><button type="button" className="admin-text-link" onClick={() => navigate(`/exams/manage?courseId=${id}`)}>إضافة امتحان <ChevronLeft size={14} /></button></div> : <div className="admin-exam-list">{exams.map((exam) => <button type="button" className="admin-exam-row" key={exam._id} onClick={() => navigate(`/admin/exams/${exam._id}`)}><span><FileText size={16} /></span><span><strong>{exam.title}</strong><small>{exam.timeLimitMin ? `${exam.timeLimitMin} دقيقة` : 'بدون وقت محدد'} · {exam.totalMarks || 0} درجات</small></span><ChevronLeft size={15} /></button>)}</div>}</aside>
      </div>
      <section className="admin-video-note"><span className="admin-note-icon"><Link2 size={18} /></span><div><strong>مصادر الفيديو</strong><p>ارفع الفيديو مباشرة إلى Bunny من هنا، أو استخدم رابط YouTube / Vimeo كخيار احتياطي. الطالب يستلم رابط التشغيل من الـ API بعد التحقق من تفعيله.</p></div><ExternalLink size={16} /></section>
      {dialog && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(false); }}><div className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="lesson-dialog-title"><div className="admin-dialog-head"><div><span className="admin-eyebrow">{editing ? 'تعديل الدرس' : 'درس جديد'}</span><h2 id="lesson-dialog-title">{editing ? 'تعديل بيانات الدرس' : 'إضافة درس للباب'}</h2></div><button type="button" onClick={() => setDialog(false)} aria-label="إغلاق"><X size={18} /></button></div>
        <form className="admin-form" onSubmit={submit}>
          <label>عنوان الدرس<input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="مثال: مفهوم الحركة" /></label>
          <div className="admin-form-grid"><label>المدة بالدقائق<input type="number" min="0" value={form.duration} onChange={(event) => updateField('duration', event.target.value)} /></label><label>ترتيب الدرس<input type="number" min="0" value={form.order} onChange={(event) => updateField('order', event.target.value)} /></label></div>
          <label>وصف مختصر<textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={3} placeholder="ما الذي سيتعلمه الطالب؟" /></label>
          <label>مصدر الفيديو<select value={form.provider} onChange={(event) => updateField('provider', event.target.value as Provider)}><option value="bunny">Bunny Stream — المفضل</option><option value="youtube">YouTube — احتياطي</option><option value="vimeo">Vimeo — احتياطي</option></select></label>
          {form.provider === 'bunny' ? <><label className="file-picker-label">ملف الفيديو<input type="file" accept="video/*" onChange={selectFile} /><small>{form.videoFile ? form.videoFile.name : editing?.videoId ? 'اتركه كما هو أو اختر ملفًا جديدًا للاستبدال.' : 'اختر ملف MP4 أو أي صيغة يدعمها Bunny.'}</small></label>{uploadProgress > 0 && <div className="bunny-upload-progress"><span><b>رفع Bunny</b><strong>{uploadProgress}٪</strong></span><i><em style={{ transform: `scaleX(${uploadProgress / 100})` }} /></i></div>}<div className="admin-url-hint"><Video size={15} /> الملف يذهب مباشرة إلى Bunny؛ مفاتيح Bunny لا تصل إلى المتصفح.</div></> : <><label>رابط الفيديو<input dir="ltr" value={form.videoUrl} onChange={(event) => updateField('videoUrl', event.target.value)} placeholder={form.provider === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://vimeo.com/...'} /></label><div className="admin-url-hint"><Link2 size={15} /> يقبل روابط {form.provider === 'youtube' ? 'YouTube' : 'Vimeo'}.</div></>}
          <button type="submit" className="admin-primary full-admin-button" disabled={saving}>{saving ? <><span className="spinner spinner-light" /> {uploadProgress > 0 && uploadProgress < 100 ? `جارٍ الرفع ${uploadProgress}٪...` : 'جارٍ الحفظ...'}</> : <><Check size={16} /> حفظ الدرس</>}</button>
        </form>
      </div></div>}
    </div>
  </AppShell>;
}
