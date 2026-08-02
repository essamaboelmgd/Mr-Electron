import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ExternalLink, FileText, LockKeyhole, PlayCircle, RefreshCw, ShieldAlert, Video } from 'lucide-react';
import { useNavigate, useParams } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import VideoPlayer from '@/components/VideoPlayer';
import { Course, getCourseById, getCourseExams, getCourseLessons, getLessonVideoUrl, Lesson } from '@/services/coursesService';
import { Exam } from '@/services/examsService';

const requestMessage = (error: unknown, fallback: string) => {
  const typed = error as { response?: { data?: { message?: string | string[] } } };
  const message = typed.response?.data?.message;
  return Array.isArray(message) ? message.join('، ') : message || fallback;
};

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [lessonPage, setLessonPage] = useState(1);
  const [lessonPagination, setLessonPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number; hasNextPage: boolean; hasPrevPage: boolean } | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoSource, setVideoSource] = useState<{ provider: 'youtube' | 'vimeo' | 'bunny'; videoId: string; videoStatus?: string; progress?: { lastPositionSeconds: number } | null } | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true); setError('');
    Promise.all([getCourseById(id), getCourseLessons(id, { page: lessonPage, limit: 10 }), getCourseExams(id)]).then(([chapter, chapterLessons, chapterExams]) => { setCourse(chapter); setLessons(chapterLessons.lessons); setLessonPagination(chapterLessons.pagination); setExams(chapterExams); }).catch((requestError: unknown) => setError(requestMessage(requestError, 'تعذر تحميل الباب.'))).finally(() => setLoading(false));
  };
  useEffect(load, [id, lessonPage]);

  const activeLessons = useMemo(() => lessons.filter((lesson) => lesson.access === 'active').length, [lessons]);
  const openLesson = async (lesson: Lesson) => {
    setNotice('');
    if (lesson.isLocked) { setSelectedLesson(null); setVideoUrl(''); setVideoSource(null); setNotice('هذا الدرس ظاهر لك ضمن خطة الباب، لكنه مقفول حاليًا. اطلب من المدرس تفعيله.'); return; }
    setSelectedLesson(lesson); setVideoUrl(''); setVideoSource(null); setVideoLoading(true);
    try { const result = await getLessonVideoUrl(lesson._id); setVideoUrl(result.videoUrl); setVideoSource(result); } catch (requestError: unknown) { setVideoUrl(''); setVideoSource(null); setNotice(requestMessage(requestError, 'تعذر فتح الفيديو.')); } finally { setVideoLoading(false); }
  };

  if (loading) return <AppShell><div className="loading-panel"><span className="spinner" /> جارٍ تجهيز الباب...</div></AppShell>;
  if (error || !course) return <AppShell><div className="error-state"><ShieldAlert size={28} /><h1>الباب غير متاح</h1><p>{error || 'تأكد من الرابط وحاول مرة أخرى.'}</p><button type="button" className="primary-button" onClick={load}><RefreshCw size={16} /> إعادة المحاولة</button></div></AppShell>;

  return <AppShell><div className="page-stack"><button className="back-link" type="button" onClick={() => navigate('/courses')}><ArrowRight size={17} /> العودة للمنهج</button><section className="chapter-hero"><div><span className="scope-label">{course.term === 'first' ? 'الترم الأول' : 'الترم الثاني'}</span><h1>{course.title}</h1><p>{course.description || 'تابع دروس هذا الباب بالترتيب الذي يناسبك.'}</p><div className="hero-stats"><span><Video size={15} /> {course.lessonCount || lessons.length} دروس</span><span><CheckCircle2 size={15} /> {activeLessons} متاحة</span><span><FileText size={15} /> {exams.length} امتحان</span></div></div><div className={course.accessEnabled ? 'access-stamp open' : 'access-stamp'}>{course.accessEnabled ? <><CheckCircle2 size={22} /> الباب مفتوح</> : <><LockKeyhole size={22} /> الباب مقفول</>}</div></section>{notice && <div className="inline-notice" role="status"><LockKeyhole size={17} /> {notice}</div>}<div className="chapter-layout"><section className="lessons-panel"><div className="section-heading compact"><div><span className="eyebrow">محتوى الباب</span><h2>الدروس</h2></div><span className="count-chip">{course.lessonCount || lessons.length} دروس</span></div><div className="lesson-list">{lessons.length === 0 ? <div className="empty-mini">لم يضف المدرس دروس هذا الباب بعد.</div> : lessons.map((lesson, index) => <button type="button" className={`lesson-row ${lesson.access === 'locked' ? 'is-locked' : ''} ${selectedLesson?._id === lesson._id ? 'is-selected' : ''}`} key={lesson._id} onClick={() => openLesson(lesson)}><span className={`lesson-number ${lesson.access === 'active' ? 'open' : ''}`}>{lesson.access === 'active' ? <PlayCircle size={16} /> : <LockKeyhole size={16} />}</span><span className="lesson-copy"><strong>{String((lessonPage - 1) * 10 + index + 1).padStart(2, '0')} · {lesson.title}</strong><small>{lesson.duration ? `${lesson.duration} دقيقة` : 'درس فيديو'} {lesson.description ? ` · ${lesson.description}` : ''}</small></span><span className="lesson-action">{lesson.access === 'active' ? 'شاهد' : 'مقفول'} <ChevronLeft size={15} /></span></button>)}</div>{lessonPagination && lessonPagination.totalPages > 1 && <div className="pagination-controls"><button type="button" onClick={() => setLessonPage((value) => value - 1)} disabled={!lessonPagination.hasPrevPage}><ChevronRight size={15} /> السابق</button><span>صفحة {lessonPagination.currentPage} من {lessonPagination.totalPages}</span><button type="button" onClick={() => setLessonPage((value) => value + 1)} disabled={!lessonPagination.hasNextPage}>التالي <ChevronLeft size={15} /></button></div>}</section><aside className="lesson-viewer">{selectedLesson ? <div className="viewer-content"><div className="viewer-header"><div><span className="eyebrow">الدرس الحالي</span><h2>{selectedLesson.title}</h2></div><span className="provider-chip">{videoSource?.provider === 'bunny' || selectedLesson.videoProvider === 'bunny' ? 'Bunny' : videoSource?.provider === 'vimeo' || selectedLesson.videoProvider === 'vimeo' ? 'Vimeo' : 'YouTube'}</span></div>{videoLoading ? <div className="video-placeholder"><span className="spinner" /> جارٍ فتح الفيديو...</div> : videoUrl && videoSource ? <VideoPlayer lessonId={selectedLesson._id} title={selectedLesson.title} initialPositionSeconds={videoSource.progress?.lastPositionSeconds || 0} source={{ url: videoUrl, provider: videoSource.provider, videoId: videoSource.videoId }} /> : <div className="video-placeholder"><ShieldAlert size={24} /><p>لم نتمكن من فتح الفيديو.</p></div>}<div className="viewer-footer"><span><Clock3 size={15} /> {selectedLesson.duration || '—'} دقيقة</span><span>تُحفظ المشاهدة تلقائيًا</span></div></div> : <div className="viewer-empty"><span className="viewer-icon"><PlayCircle size={25} /></span><h2>اختار درسًا للبدء</h2><p>{course.accessEnabled ? 'اضغط على أي درس مفتوح من القائمة.' : 'تقدر تشوف عناوين الدروس، وسيظهر الفيديو بعد التفعيل.'}</p></div>}</aside></div>{exams.length > 0 && <section className="chapter-exams"><div className="section-heading compact"><div><span className="eyebrow">قياس الفهم</span><h2>امتحانات الباب</h2></div><button type="button" className="text-button" onClick={() => navigate('/exams/course')}>كل الامتحانات <ChevronLeft size={16} /></button></div><div className="exam-strip">{exams.map((exam) => <article className="exam-mini" key={exam._id}><span className="exam-icon"><FileText size={18} /></span><div><strong>{exam.title}</strong><small>{exam.timeLimitMin ? `${exam.timeLimitMin} دقيقة` : 'بدون وقت محدد'} · {exam.totalMarks || 0} درجات</small></div><button type="button" onClick={() => navigate(`/exams/${exam._id}/take`)} disabled={!course.accessEnabled}>ابدأ <ExternalLink size={14} /></button></article>)}</div></section>}</div></AppShell>;
}
