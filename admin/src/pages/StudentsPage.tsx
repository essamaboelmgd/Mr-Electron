import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, FileText, LockKeyhole, Search, ShieldCheck, UserRound, Video } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { EducationalLevel, getEducationalLevels } from '@/services/educationalLevelService';
import {
  AccessCourse,
  getStudentAccess,
  getStudentExamAttempts,
  getStudentOverview,
  getStudentVideoActivity,
  getStudents,
  Pagination,
  setCourseAccess,
  setLessonAccess,
  StudentAccess,
  StudentOverview
} from '@/services/accessService';
import { downloadStudentReport } from '@/services/reportsService';

type Tab = 'overview' | 'access' | 'exams' | 'videos';

const tabItems: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'access', label: 'تفعيل المحتوى' },
  { key: 'exams', label: 'محاولات الامتحانات' },
  { key: 'videos', label: 'نشاط الفيديو' }
];

export default function StudentsPage() {
  const navigate = useNavigate();
  const { id: routeStudentId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: Tab = tabItems.find((item) => item.key === requestedTab)?.key || 'overview';
  const [students, setStudents] = useState<any[]>([]);
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [access, setAccess] = useState<StudentAccess | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [videoActivity, setVideoActivity] = useState<any[]>([]);
  const [detailPagination, setDetailPagination] = useState<Pagination | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPage, setDetailPage] = useState(1);
  const [attemptReason, setAttemptReason] = useState('');
  const [videoCourseId, setVideoCourseId] = useState('');
  const [videoCompletion, setVideoCompletion] = useState('');
  const [savingKey, setSavingKey] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const selectedStudent = students.find((student) => student._id === routeStudentId) || overview?.user;

  const loadStudents = async () => {
    setLoading(true);
    try {
      const result = await getStudents({ search: search.trim() || undefined, educationalLevel: level || undefined, page, limit: 20 });
      setStudents(result.users);
      setPagination(result.pagination);
      if (routeStudentId && !result.users.some((student) => student._id === routeStudentId) && !overview) {
        // The detail endpoint still decides whether a direct link is valid.
      }
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'تعذر تحميل قائمة الطلاب.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getEducationalLevels().then((result) => setLevels(result.data)).catch(() => undefined); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadStudents(), search ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [search, level, page]);
  useEffect(() => { setPage(1); }, [search, level]);

  useEffect(() => {
    if (!routeStudentId) {
      setOverview(null);
      setAccess(null);
      return;
    }
    setDetailPage(1);
    setDetailLoading(true);
    Promise.all([getStudentOverview(routeStudentId), getStudentAccess(routeStudentId)])
      .then(([overviewData, accessData]) => { setOverview(overviewData); setAccess(accessData); setError(''); })
      .catch((requestError: any) => setError(requestError.response?.data?.message || 'تعذر تحميل ملف الطالب.'))
      .finally(() => setDetailLoading(false));
  }, [routeStudentId]);

  useEffect(() => {
    if (!routeStudentId || activeTab === 'overview' || activeTab === 'access') return;
    setDetailLoading(true);
    const request = activeTab === 'exams'
      ? getStudentExamAttempts(routeStudentId, { page: detailPage, limit: 10, submittedReason: attemptReason || undefined }).then((result) => { setAttempts(result.attempts); setDetailPagination(result.pagination); })
      : getStudentVideoActivity(routeStudentId, { page: detailPage, limit: 10, courseId: videoCourseId || undefined, completion: (videoCompletion || undefined) as 'completed' | 'incomplete' | undefined }).then((result) => { setVideoActivity(result.activity); setDetailPagination(result.pagination); });
    request.catch((requestError: any) => setError(requestError.response?.data?.message || 'تعذر تحميل بيانات المتابعة.')).finally(() => setDetailLoading(false));
  }, [routeStudentId, activeTab, detailPage, attemptReason, videoCourseId, videoCompletion]);

  useEffect(() => { setDetailPage(1); }, [attemptReason, videoCourseId, videoCompletion]);

  const selectStudent = (studentId: string) => navigate(`/students/${studentId}`);
  const selectTab = (tab: Tab) => {
    if (!routeStudentId) return;
    setDetailPage(1);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };
  const refreshAccess = () => { if (routeStudentId) getStudentAccess(routeStudentId).then(setAccess).catch(() => setError('تعذر تحديث صلاحيات الطالب.')); };
  const toggleCourse = async (course: AccessCourse) => {
    if (!routeStudentId) return;
    const key = `course-${course._id}`;
    setSavingKey(key);
    try { await setCourseAccess(routeStudentId, course._id, !course.accessEnabled); refreshAccess(); } catch { setError('تعذر تعديل تفعيل الباب.'); } finally { setSavingKey(''); }
  };
  const toggleLesson = async (course: AccessCourse, lesson: AccessCourse['lessons'][number]) => {
    if (!routeStudentId || !course.accessEnabled) return;
    const key = `lesson-${lesson.id}`;
    setSavingKey(key);
    try { await setLessonAccess(routeStudentId, lesson.id, !lesson.accessEnabled); refreshAccess(); } catch { setError('تعذر تعديل تفعيل الدرس.'); } finally { setSavingKey(''); }
  };

  const downloadReport = async () => {
    if (!routeStudentId) return;
    setReportLoading(true);
    try { await downloadStudentReport(routeStudentId); } catch { setError('تعذر تجهيز تقرير الطالب.'); } finally { setReportLoading(false); }
  };

  return <AppShell><div className="admin-page-stack students-directory-page"><section className="admin-page-intro"><div><span className="admin-eyebrow">متابعة ومساحة الطلاب</span><h1>الطلاب</h1><p>ابحث عن الطالب، افتح ملفه، وتابع المحتوى والامتحانات والفيديوهات من مكان واحد.</p></div>{routeStudentId && <button type="button" className="admin-secondary" onClick={() => void downloadReport()} disabled={reportLoading}><Download size={16} /> {reportLoading ? 'جارٍ تجهيز PDF...' : 'تحميل تقرير PDF'}</button>}</section>{error && <div className="admin-error" role="alert">{error}</div>}<div className="students-directory-layout"><section className="students-list-panel"><div className="admin-section-heading"><div><span className="admin-eyebrow">قائمة الطلاب</span><h2>كل الطلاب</h2></div><span className="admin-count">{pagination?.totalItems || 0}</span></div><div className="admin-student-filters"><div className="admin-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="اسم أو رقم هاتف" /></div><label className="admin-select full-select"><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="">كل الصفوف</option>{levels.map((item) => <option value={item._id} key={item._id}>{item.nameAr}</option>)}</select><ChevronDown size={14} /></label></div>{loading ? <div className="admin-loading-panel small"><span className="spinner" /> جارٍ تحميل الطلاب...</div> : students.length === 0 ? <div className="admin-empty-mini"><UserRound size={21} /><p>لا يوجد طلاب بهذا البحث.</p></div> : <div className="student-list">{students.map((student) => <button type="button" className={`student-list-row ${student._id === routeStudentId ? 'is-selected' : ''}`} key={student._id} onClick={() => selectStudent(student._id)}><span className="student-avatar">{student.name?.charAt(0) || 'ط'}</span><span><strong>{student.name}</strong><small>{student.educationalLevel?.nameAr || 'صف غير محدد'} · {student.phone}</small></span><ChevronLeft size={15} /></button>)}</div>}{pagination && <PaginationControls pagination={pagination} onChange={setPage} />}</section><section className="student-detail-panel">{!routeStudentId ? <div className="admin-empty student-detail-empty"><ShieldCheck size={28} /><h2>اختار طالبًا من القائمة</h2><p>ستظهر هنا بياناته وتفعيل المحتوى ونتائج الامتحانات ونشاط الفيديو.</p></div> : detailLoading && !overview ? <div className="admin-loading-panel"><span className="spinner" /> جارٍ فتح ملف الطالب...</div> : overview && access ? <><StudentProfileHeader overview={overview} onTab={selectTab} activeTab={activeTab} />{activeTab === 'overview' && <OverviewPanel overview={overview} onTab={selectTab} />}{activeTab === 'access' && <AccessPanel access={access} savingKey={savingKey} onToggleCourse={toggleCourse} onToggleLesson={toggleLesson} />}{activeTab === 'exams' && <AttemptsPanel attempts={attempts} pagination={detailPagination} loading={detailLoading} onPage={setDetailPage} reason={attemptReason} onReasonChange={setAttemptReason} />}{activeTab === 'videos' && <VideoActivityPanel activity={videoActivity} pagination={detailPagination} loading={detailLoading} onPage={setDetailPage} courses={access.courses} courseId={videoCourseId} onCourseChange={setVideoCourseId} completion={videoCompletion} onCompletionChange={setVideoCompletion} />}</> : <div className="admin-empty"><UserRound size={25} /><h2>الطالب غير موجود</h2><button type="button" className="admin-secondary" onClick={() => navigate('/students')}>العودة لقائمة الطلاب</button></div>}</section></div></div></AppShell>;
}

function StudentProfileHeader({ overview, activeTab, onTab }: { overview: StudentOverview; activeTab: Tab; onTab: (tab: Tab) => void }) {
  const user = overview.user;
  return <><section className="student-profile-head"><span className="student-profile-avatar">{user.name?.charAt(0) || 'ط'}</span><div><span className="admin-eyebrow">ملف الطالب</span><h2>{user.name}</h2><p>{user.educationalLevel?.nameAr || 'صف غير محدد'} · {user.phone}</p></div><span className="student-profile-date">منذ {new Date(user.createdAt).toLocaleDateString('ar-EG')}</span></section><nav className="student-detail-tabs" aria-label="تفاصيل الطالب" role="tablist">{tabItems.map((item) => <button type="button" role="tab" aria-selected={activeTab === item.key} className={activeTab === item.key ? 'is-active' : ''} onClick={() => onTab(item.key)} key={item.key}>{item.label}</button>)}</nav></>;
}

function OverviewPanel({ overview, onTab }: { overview: StudentOverview; onTab: (tab: Tab) => void }) {
  const stats = overview.stats;
  const watchedMinutes = Math.round((stats.watchedSeconds || 0) / 60);
  return <div className="student-panel-stack"><div className="student-stats-grid"><Stat label="أبواب مفتوحة" value={stats.openCourses} icon={<ShieldCheck size={18} />} /><Stat label="دروس مفعلة" value={stats.openLessons} icon={<Video size={18} />} /><Stat label="محاولات امتحان" value={stats.examAttempts} icon={<FileText size={18} />} /><Stat label="دقائق مشاهدة" value={watchedMinutes} icon={<Clock3 size={18} />} /></div><section className="student-panel-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">آخر متابعة</span><h3>أحدث محاولات الامتحانات</h3></div><button type="button" className="admin-text-link" onClick={() => onTab('exams')}>كل النتائج <ChevronLeft size={14} /></button></div>{overview.latestAttempts.length === 0 ? <div className="admin-empty-mini">لم يسجل الطالب أي محاولة بعد.</div> : <div className="student-latest-attempts">{overview.latestAttempts.map((attempt: any) => <div className="student-latest-row" key={attempt._id}><span><strong>{attempt.examId?.title || 'امتحان'}</strong><small>{new Date(attempt.submittedAt).toLocaleDateString('ar-EG')} · المحاولة {attempt.attemptNumber || 1}</small></span><b>{attempt.percentage}٪</b></div>)}</div>}</section><section className="student-panel-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">المحتوى</span><h3>آخر نشاط فيديو</h3></div><button type="button" className="admin-text-link" onClick={() => onTab('videos')}>تفاصيل المشاهدة <ChevronLeft size={14} /></button></div><p className="student-help-line">سجلنا {stats.videoLessons} درسًا بدأه الطالب، بإجمالي {watchedMinutes} دقيقة مشاهدة و{stats.completedVideos} دروس مكتملة.</p></section></div>;
}

function AccessPanel({ access, savingKey, onToggleCourse, onToggleLesson }: { access: StudentAccess; savingKey: string; onToggleCourse: (course: AccessCourse) => void; onToggleLesson: (course: AccessCourse, lesson: AccessCourse['lessons'][number]) => void }) {
  const grouped = { first: access.courses.filter((course) => course.term === 'first'), second: access.courses.filter((course) => course.term === 'second') };
  return <div className="access-panel-inner"><div className="access-rule-callout"><ShieldCheck size={18} /><span><strong>قاعدة الوصول</strong><small>فتح الباب يفتح دروسه، ويمكن تعديل درس كاستثناء.</small></span></div>{(['first', 'second'] as const).map((term) => <section className="access-term-block" key={term}><div className="access-term-label"><span>{term === 'first' ? '01' : '02'}</span><div><strong>{term === 'first' ? 'الترم الأول' : 'الترم الثاني'}</strong><small>الأبواب والدروس</small></div></div>{grouped[term].length === 0 ? <div className="admin-empty-mini">لا توجد أبواب في هذا الترم.</div> : grouped[term].map((course) => <AccessCourseRow key={course._id} course={course} savingKey={savingKey} onToggleCourse={onToggleCourse} onToggleLesson={onToggleLesson} />)}</section>)}</div>;
}

function AccessCourseRow({ course, savingKey, onToggleCourse, onToggleLesson }: { course: AccessCourse; savingKey: string; onToggleCourse: (course: AccessCourse) => void; onToggleLesson: (course: AccessCourse, lesson: AccessCourse['lessons'][number]) => void }) {
  return <article className={`access-course-row ${course.accessEnabled ? 'is-open' : ''}`}><div className="access-course-head"><span className="access-course-icon">{course.accessEnabled ? <Check size={16} /> : <LockKeyhole size={16} />}</span><span><strong>{course.title}</strong><small>{course.lessons.length} دروس · {course.accessEnabled ? 'كل الدروس مفتوحة' : 'المحتوى مقفول'}</small></span><button type="button" className={`access-switch ${course.accessEnabled ? 'is-on' : ''}`} onClick={() => onToggleCourse(course)} disabled={savingKey === `course-${course._id}`} aria-label={course.accessEnabled ? 'إغلاق الباب' : 'فتح الباب'}><span /></button></div><div className="access-lessons">{course.lessons.length === 0 ? <small className="admin-muted">لا توجد دروس بعد.</small> : course.lessons.map((lesson) => <div className={`access-lesson-row ${!course.accessEnabled ? 'is-disabled' : ''}`} key={lesson.id}><span><Video size={14} /><strong>{lesson.title}</strong>{lesson.accessOverride !== null && <em>{lesson.accessEnabled ? 'استثناء مفتوح' : 'استثناء مقفول'}</em>}</span><button type="button" className={`lesson-lock-button ${lesson.accessEnabled ? 'is-open' : ''}`} disabled={!course.accessEnabled || savingKey === `lesson-${lesson.id}`} onClick={() => onToggleLesson(course, lesson)} aria-label={lesson.accessEnabled ? 'قفل الدرس' : 'فتح الدرس'}>{lesson.accessEnabled ? <Check size={14} /> : <LockKeyhole size={14} />}</button></div>)}</div></article>;
}

function AttemptsPanel({ attempts, pagination, loading, onPage, reason, onReasonChange }: { attempts: any[]; pagination: Pagination | null; loading: boolean; onPage: (page: number) => void; reason: string; onReasonChange: (value: string) => void }) {
  return <section className="student-panel-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">نتائج دقيقة</span><h3>كل محاولات الامتحانات</h3></div><span className="admin-count">{pagination?.totalItems || 0}</span></div><div className="student-detail-filters"><label className="admin-select"><select value={reason} onChange={(event) => onReasonChange(event.target.value)}><option value="">كل أنواع التسليم</option><option value="manual">تسليم يدوي</option><option value="auto">تسليم تلقائي</option><option value="timeout">انتهى الوقت</option></select><ChevronDown size={14} /></label></div>{loading ? <div className="admin-loading-panel small"><span className="spinner" /> جارٍ تحميل المحاولات...</div> : attempts.length === 0 ? <div className="admin-empty-mini">لا توجد محاولات لهذا الطالب.</div> : <div className="student-data-table"><div className="student-data-head"><span>الامتحان</span><span>المحاولة</span><span>الدرجة</span><span>التاريخ</span></div>{attempts.map((attempt) => <div className="student-data-row" key={attempt._id}><span><strong>{attempt.examId?.title || 'امتحان'}</strong><small>{attempt.submittedReason === 'auto' || attempt.submittedReason === 'timeout' ? 'تسليم تلقائي لانتهاء الوقت' : 'تسليم يدوي'}</small></span><span>{attempt.attemptNumber || 1}</span><b className={attempt.isPassed ? 'is-good' : 'is-low'}>{attempt.score} / {attempt.totalMarks} · {attempt.percentage}٪</b><span>{new Date(attempt.submittedAt).toLocaleDateString('ar-EG')}</span></div>)}</div>}{pagination && <PaginationControls pagination={pagination} onChange={onPage} />}</section>;
}

function VideoActivityPanel({ activity, pagination, loading, onPage, courses, courseId, onCourseChange, completion, onCompletionChange }: { activity: any[]; pagination: Pagination | null; loading: boolean; onPage: (page: number) => void; courses: AccessCourse[]; courseId: string; onCourseChange: (value: string) => void; completion: string; onCompletionChange: (value: string) => void }) {
  return <section className="student-panel-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">متابعة الفيديو</span><h3>نشاط المشاهدة</h3></div><span className="admin-count">{pagination?.totalItems || 0}</span></div><div className="student-detail-filters"><label className="admin-select"><select value={courseId} onChange={(event) => onCourseChange(event.target.value)}><option value="">كل الأبواب</option>{courses.map((course) => <option value={course._id} key={course._id}>{course.title}</option>)}</select><ChevronDown size={14} /></label><label className="admin-select"><select value={completion} onChange={(event) => onCompletionChange(event.target.value)}><option value="">كل حالات المشاهدة</option><option value="completed">مكتمل</option><option value="incomplete">غير مكتمل</option></select><ChevronDown size={14} /></label></div>{loading ? <div className="admin-loading-panel small"><span className="spinner" /> جارٍ تحميل النشاط...</div> : activity.length === 0 ? <div className="admin-empty-mini">لم يبدأ الطالب أي فيديو بعد.</div> : <div className="student-data-table"><div className="student-data-head"><span>الدرس</span><span>الجلسات</span><span>المشاهدة</span><span>آخر نشاط</span></div>{activity.map((item) => <div className="student-data-row" key={item._id}><span><strong>{item.lessonId?.title || 'درس'}</strong><small>{item.lessonId?.courseId?.title || 'باب غير معروف'}</small></span><span>{item.sessionCount || 0} مرات</span><b>{Math.round((item.watchedSeconds || 0) / 60)} دقيقة · {Math.round(item.completionPercent || 0)}٪</b><span>{new Date(item.lastWatchedAt).toLocaleDateString('ar-EG')}</span></div>)}</div>}{pagination && <PaginationControls pagination={pagination} onChange={onPage} />}</section>;
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <article className="student-stat"><span>{icon}</span><strong>{value.toLocaleString('ar-EG')}</strong><small>{label}</small></article>;
}

function PaginationControls({ pagination, onChange }: { pagination: Pagination; onChange: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null;
  return <div className="pagination-controls"><button type="button" onClick={() => onChange(pagination.currentPage - 1)} disabled={!pagination.hasPrevPage}><ChevronRight size={15} /> السابق</button><span>صفحة {pagination.currentPage} من {pagination.totalPages}</span><button type="button" onClick={() => onChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage}>التالي <ChevronLeft size={15} /></button></div>;
}
