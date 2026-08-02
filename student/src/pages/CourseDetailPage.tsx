import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, Clock3, ExternalLink, FileText, LockKeyhole, PlayCircle, RefreshCw, ShieldAlert, Video } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Course, getCourseById, getCourseExams, getCourseLessons, getLessonVideoUrl, Lesson } from '@/services/coursesService';
import { Exam } from '@/services/examsService';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true); setError('');
    Promise.all([getCourseById(id), getCourseLessons(id), getCourseExams(id)]).then(([chapter, chapterLessons, chapterExams]) => { setCourse(chapter); setLessons(chapterLessons); setExams(chapterExams); }).catch((requestError: any) => setError(requestError.response?.data?.message || 'تعذر تحميل الباب.')).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const activeLessons = useMemo(() => lessons.filter((lesson) => lesson.access === 'active').length, [lessons]);
  const openLesson = async (lesson: Lesson) => {
    setNotice('');
    if (lesson.isLocked) { setSelectedLesson(null); setVideoUrl(''); setNotice('هذا الدرس ظاهر لك ضمن خطة الباب، لكنه مقفول حاليًا. اطلب من المدرس تفعيله.'); return; }
    setSelectedLesson(lesson); setVideoLoading(true);
    try { const result = await getLessonVideoUrl(lesson._id); setVideoUrl(result.videoUrl); } catch (requestError: any) { setVideoUrl(''); setNotice(requestError.response?.data?.message || 'تعذر فتح الفيديو.'); } finally { setVideoLoading(false); }
  };

  if (loading) return <AppShell><div className="loading-panel"><span className="spinner" /> جارٍ تجهيز الباب...</div></AppShell>;
  if (error || !course) return <AppShell><div className="error-state"><ShieldAlert size={28} /><h1>الباب غير متاح</h1><p>{error || 'تأكد من الرابط وحاول مرة أخرى.'}</p><button type="button" className="primary-button" onClick={load}><RefreshCw size={16} /> إعادة المحاولة</button></div></AppShell>;

  return <AppShell><div className="page-stack"><button className="back-link" type="button" onClick={() => navigate('/courses')}><ArrowRight size={17} /> العودة للمنهج</button><section className="chapter-hero"><div><span className="scope-label">{course.term === 'first' ? 'الترم الأول' : 'الترم الثاني'}</span><h1>{course.title}</h1><p>{course.description || 'تابع دروس هذا الباب بالترتيب الذي يناسبك.'}</p><div className="hero-stats"><span><Video size={15} /> {lessons.length} دروس</span><span><CheckCircle2 size={15} /> {activeLessons} متاحة</span><span><FileText size={15} /> {exams.length} امتحان</span></div></div><div className={course.accessEnabled ? 'access-stamp open' : 'access-stamp'}>{course.accessEnabled ? <><CheckCircle2 size={22} /> الباب مفتوح</> : <><LockKeyhole size={22} /> الباب مقفول</>}</div></section>{notice && <div className="inline-notice" role="status"><LockKeyhole size={17} /> {notice}</div>}<div className="chapter-layout"><section className="lessons-panel"><div className="section-heading compact"><div><span className="eyebrow">محتوى الباب</span><h2>الدروس</h2></div><span className="count-chip">{lessons.length} دروس</span></div><div className="lesson-list">{lessons.length === 0 ? <div className="empty-mini">لم يضف المدرس دروس هذا الباب بعد.</div> : lessons.map((lesson, index) => <button type="button" className={`lesson-row ${lesson.access === 'locked' ? 'is-locked' : ''} ${selectedLesson?._id === lesson._id ? 'is-selected' : ''}`} key={lesson._id} onClick={() => openLesson(lesson)}><span className={`lesson-number ${lesson.access === 'active' ? 'open' : ''}`}>{lesson.access === 'active' ? <PlayCircle size={16} /> : <LockKeyhole size={16} />}</span><span className="lesson-copy"><strong>{String(index + 1).padStart(2, '0')} · {lesson.title}</strong><small>{lesson.duration ? `${lesson.duration} دقيقة` : 'درس فيديو'} {lesson.description ? ` · ${lesson.description}` : ''}</small></span><span className="lesson-action">{lesson.access === 'active' ? 'شاهد' : 'مقفول'} <ChevronLeft size={15} /></span></button>)}</div></section><aside className="lesson-viewer">{selectedLesson ? <div className="viewer-content"><div className="viewer-header"><div><span className="eyebrow">الدرس الحالي</span><h2>{selectedLesson.title}</h2></div><span className="provider-chip">{selectedLesson.videoProvider === 'vimeo' ? 'Vimeo' : 'YouTube'}</span></div>{videoLoading ? <div className="video-placeholder"><span className="spinner" /> جارٍ فتح الفيديو...</div> : videoUrl ? <div className="video-frame"><iframe src={videoUrl} title={selectedLesson.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /></div> : <div className="video-placeholder"><ShieldAlert size={24} /><p>لم نتمكن من فتح الفيديو.</p></div>}<div className="viewer-footer"><span><Clock3 size={15} /> {selectedLesson.duration || '—'} دقيقة</span><span>فيديو شرح</span></div></div> : <div className="viewer-empty"><span className="viewer-icon"><PlayCircle size={25} /></span><h2>اختار درسًا للبدء</h2><p>{course.accessEnabled ? 'اضغط على أي درس مفتوح من القائمة.' : 'تقدر تشوف عناوين الدروس، وسيظهر الفيديو بعد التفعيل.'}</p></div>}</aside></div>{exams.length > 0 && <section className="chapter-exams"><div className="section-heading compact"><div><span className="eyebrow">قياس الفهم</span><h2>امتحانات الباب</h2></div><button type="button" className="text-button" onClick={() => navigate('/exams/course')}>كل الامتحانات <ChevronLeft size={16} /></button></div><div className="exam-strip">{exams.map((exam) => <article className="exam-mini" key={exam._id}><span className="exam-icon"><FileText size={18} /></span><div><strong>{exam.title}</strong><small>{exam.timeLimitMin ? `${exam.timeLimitMin} دقيقة` : 'بدون وقت محدد'} · {exam.totalMarks || 0} درجات</small></div><button type="button" onClick={() => navigate(`/exams/${exam._id}/take`)} disabled={!course.accessEnabled}>ابدأ <ExternalLink size={14} /></button></article>)}</div></section>}</div></AppShell>;
}
