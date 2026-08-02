import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import Exam from '../models/Exam';
import Question from '../models/Question';
import Submission from '../models/Submission';
import User from '../models/User';
import Course from '../models/Course';
import CourseAccess from '../models/CourseAccess';
import LessonAccess from '../models/LessonAccess';
import Lesson from '../models/Lesson';
import VideoProgress from '../models/VideoProgress';
import { AppError } from '../middleware/errorHandler';

const fontCandidates = [
  process.env.PDF_FONT_PATH,
  path.resolve(process.cwd(), 'assets/fonts/NotoSansArabic-Regular.ttf'),
  '/usr/share/fonts/google-noto-vf/NotoSansArabic[wght].ttf',
  '/usr/share/fonts/google-noto-vf/NotoNaskhArabic[wght].ttf',
  '/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf'
].filter(Boolean) as string[];

const resolveFont = () => fontCandidates.find((candidate) => fs.existsSync(candidate));

const formatDate = (value?: Date | string | null) => value
  ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
  : 'غير محدد';

const formatDuration = (seconds: number) => {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remaining = value % 60;
  return hours ? `${hours}س ${minutes}د` : `${minutes}د ${remaining}ث`;
};

const percentage = (score: number, total: number) => total ? Math.round((score / total) * 100) : 0;

const reviewAvailable = (exam: any) => {
  if (exam.reviewMode === 'open') return true;
  return exam.reviewMode === 'scheduled' && exam.reviewReleaseAt
    ? new Date(exam.reviewReleaseAt).getTime() <= Date.now()
    : false;
};

const setupDocument = (res: Response, filename: string) => {
  const document = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
  const font = resolveFont();
  if (!font) throw new AppError('خط PDF العربي غير مثبت. عيّن PDF_FONT_PATH إلى ملف Noto Sans Arabic على السيرفر.', 503);
  document.font(font);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.setHeader('Cache-Control', 'private, no-store');
  document.pipe(res);
  return document;
};

const ensureRoom = (document: PDFKit.PDFDocument, height = 36) => {
  if (document.y > document.page.height - document.page.margins.bottom - height) document.addPage();
};

const heading = (document: PDFKit.PDFDocument, text: string) => {
  ensureRoom(document, 55);
  document.moveDown(0.8);
  document.fillColor('#0e504c').fontSize(15).text(text, { align: 'right' });
  document.moveDown(0.3);
  document.strokeColor('#d9e8e4').moveTo(document.page.margins.left, document.y)
    .lineTo(document.page.width - document.page.margins.right, document.y).stroke();
  document.moveDown(0.5);
  document.fillColor('#202331').fontSize(10);
};

const row = (document: PDFKit.PDFDocument, label: string, value: string | number) => {
  ensureRoom(document);
  document.fillColor('#6e7481').fontSize(9).text(`${label}:`, { continued: true, align: 'right' });
  document.fillColor('#202331').text(` ${value}`, { align: 'right' });
};

const finish = (document: PDFKit.PDFDocument) => {
  const range = document.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    document.switchToPage(index);
    document.fontSize(8).fillColor('#8a9398').text(`Mr Electron · صفحة ${index + 1} من ${range.count}`, 42, 800, { align: 'center', width: 511 });
  }
  document.end();
};

const studentHeader = (document: PDFKit.PDFDocument, student: any, title: string) => {
  document.fillColor('#0e504c').fontSize(22).text('Mr Electron', { align: 'right' });
  document.fillColor('#202331').fontSize(18).text(title, { align: 'right' });
  document.moveDown(0.7);
  row(document, 'الطالب', student.name);
  row(document, 'رقم الهاتف', student.phone);
  row(document, 'الصف الدراسي', student.educationalLevel?.nameAr || 'غير محدد');
  row(document, 'تاريخ التقرير', formatDate(new Date()));
};

export const sendStudentReport = async (res: Response, userId: string) => {
  const student = await User.findOne({ _id: userId, role: 'student' })
    .select('-password')
    .populate('educationalLevel', 'nameAr name level year')
    .lean();
  if (!student) throw new AppError('الطالب غير موجود', 404);

  const levelId = (student.educationalLevel as any)?._id || student.educationalLevel;
  const [courses, courseAccess, lessons, lessonAccess, progress, submissions] = await Promise.all([
    Course.find({ educationalLevel: levelId }).sort({ term: 1, order: 1 }).lean(),
    CourseAccess.find({ userId, enabled: true }).select('courseId').lean(),
    Lesson.find({ courseId: { $in: await Course.find({ educationalLevel: levelId }).distinct('_id') } }).sort({ order: 1 }).lean(),
    LessonAccess.find({ userId }).select('lessonId enabled').lean(),
    VideoProgress.find({ userId }).populate({ path: 'lessonId', select: 'title courseId' }).sort({ lastWatchedAt: -1 }).lean(),
    Submission.find({ userId, onModel: 'Exam' }).populate('examId', 'title type').sort({ submittedAt: -1 }).lean()
  ]);
  const openCourses = new Set(courseAccess.map((item: any) => String(item.courseId)));
  const lessonOverrides = new Map(lessonAccess.map((item: any) => [String(item.lessonId), item.enabled]));
  const document = setupDocument(res, `mr-electron-student-${String(student._id)}.pdf`);
  studentHeader(document, student, 'تقرير الطالب الكامل');

  heading(document, 'صلاحيات المنهج');
  courses.forEach((course: any) => {
    const courseOpen = openCourses.has(String(course._id));
    const courseLessons = lessons.filter((lesson: any) => String(lesson.courseId) === String(course._id));
    row(document, `${course.term === 'first' ? 'الترم الأول' : 'الترم الثاني'} · ${course.title}`, courseOpen ? 'مفعل' : 'غير مفعل');
    courseLessons.forEach((lesson: any) => {
      if (courseOpen || lessonOverrides.get(String(lesson._id)) !== undefined) {
        row(document, `  الدرس: ${lesson.title}`, courseOpen && lessonOverrides.get(String(lesson._id)) !== false ? 'مفعل' : 'غير مفعل');
      }
    });
  });

  heading(document, 'نتائج الامتحانات');
  if (!submissions.length) document.text('لا توجد محاولات مسجلة حتى الآن.', { align: 'right' });
  submissions.forEach((submission: any) => {
    const exam = submission.examId || {};
    row(document, `${exam.title || 'امتحان'} · المحاولة ${submission.attemptNumber || 1}`, `${submission.score} من ${submission.totalMarks} (${percentage(submission.score, submission.totalMarks)}٪)`);
    row(document, '  تاريخ التسليم', formatDate(submission.submittedAt));
    row(document, '  سبب التسليم', submission.submittedReason === 'auto' || submission.submittedReason === 'timeout' ? 'تلقائي لانتهاء الوقت' : 'يدوي');
    row(document, '  المراجعة', submission.reviewedAt ? `تمت في ${formatDate(submission.reviewedAt)}` : 'لم تتم');
  });

  heading(document, 'نشاط مشاهدة الفيديو');
  if (!progress.length) document.text('لا يوجد نشاط فيديو مسجل حتى الآن.', { align: 'right' });
  progress.forEach((item: any) => {
    const lesson = item.lessonId || {};
    row(document, lesson.title || 'درس', `${formatDuration(item.watchedSeconds)} · ${Math.round(item.completionPercent || 0)}٪ · ${item.sessionCount || 0} جلسة`);
    row(document, '  آخر مشاهدة', formatDate(item.lastWatchedAt));
  });
  finish(document);
};

export const sendExamResultsReport = async (res: Response, examId: string) => {
  const exam = await Exam.findById(examId).lean();
  if (!exam) throw new AppError('الامتحان غير موجود', 404);
  const submissions = await Submission.find({ examId, onModel: 'Exam' })
    .populate('userId', 'name phone')
    .sort({ userId: 1, submittedAt: -1 })
    .lean();
  const grouped = new Map<string, any[]>();
  submissions.forEach((submission: any) => {
    const key = String(submission.userId?._id || submission.userId);
    grouped.set(key, [...(grouped.get(key) || []), submission]);
  });
  const document = setupDocument(res, `mr-electron-exam-${String(exam._id)}-results.pdf`);
  document.fillColor('#0e504c').fontSize(22).text('Mr Electron', { align: 'right' });
  document.fillColor('#202331').fontSize(18).text(`نتائج ${exam.title}`, { align: 'right' });
  row(document, 'عدد الطلاب', grouped.size);
  row(document, 'عدد المحاولات', submissions.length);
  grouped.forEach((attempts) => {
    const student = attempts[0].userId || {};
    heading(document, `${student.name || 'طالب'} · ${student.phone || 'بدون رقم'}`);
    attempts.forEach((attempt: any) => row(document, `المحاولة ${attempt.attemptNumber || 1} · ${formatDate(attempt.submittedAt)}`, `${attempt.score} من ${attempt.totalMarks} (${percentage(attempt.score, attempt.totalMarks)}٪) · ${attempt.submittedReason === 'auto' || attempt.submittedReason === 'timeout' ? 'تلقائي' : 'يدوي'}`));
  });
  finish(document);
};

export const sendStudentExamReport = async (res: Response, userId: string, examId: string, attemptId?: string) => {
  const [student, exam, submissions] = await Promise.all([
    User.findOne({ _id: userId, role: 'student' }).select('-password').populate('educationalLevel', 'nameAr').lean(),
    Exam.findById(examId).lean(),
    Submission.find({ userId, examId, onModel: 'Exam' }).sort({ submittedAt: -1 }).lean()
  ]);
  if (!student) throw new AppError('الطالب غير موجود', 404);
  if (!exam) throw new AppError('الامتحان غير موجود', 404);
  if (!submissions.length) throw new AppError('لم يتم حل هذا الامتحان بعد.', 404);
  const selected = submissions.find((item: any) => String(item._id) === String(attemptId)) || submissions[0];
  const canReview = reviewAvailable(exam);
  const questions = canReview ? await Question.find({ examId, onModel: 'Exam' }).sort({ order: 1 }).lean() : [];
  const answers = new Map((selected.answers || []).map((answer: any) => [String(answer.questionId), answer.selectedOption]));
  const document = setupDocument(res, `mr-electron-${String(exam._id)}-result.pdf`);
  studentHeader(document, student, `نتيجة ${exam.title}`);
  heading(document, 'المحاولات');
  submissions.forEach((attempt: any) => row(document, `المحاولة ${attempt.attemptNumber || 1} · ${formatDate(attempt.submittedAt)}`, `${attempt.score} من ${attempt.totalMarks} (${percentage(attempt.score, attempt.totalMarks)}٪)`));
  if (canReview) {
    heading(document, `تفاصيل المحاولة ${selected.attemptNumber || 1}`);
    questions.forEach((question: any, index: number) => {
      const answer = answers.get(String(question._id));
      const selectedOption = (question.options || []).find((option: any) => option.id === answer);
      row(document, `السؤال ${index + 1}: ${question.content}`, selectedOption?.text || 'لم تتم الإجابة');
      row(document, '  التصحيح', answer === question.correct ? 'إجابة صحيحة' : `إجابة غير صحيحة · الصحيح: ${(question.options || []).find((option: any) => option.id === question.correct)?.text || 'غير محدد'}`);
    });
  } else {
    row(document, 'مراجعة الإجابات', 'مغلقة حاليًا من المدرس');
  }
  finish(document);
};
