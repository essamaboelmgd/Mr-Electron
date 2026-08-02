import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Exam from '../models/Exam';
import VideoProgress from '../models/VideoProgress';
import VideoWatchSession from '../models/VideoWatchSession';
import { createBunnyEmbedUrl } from '../services/bunnyService';
import { paginate, PaginationResult } from '../utils/pagination';
import {
  buildLessonAccessMap,
  getCourseAccessRecord,
  getLessonAccess,
  isContentManager,
  sameId,
  studentMatchesCourse
} from '../services/accessService';

export type VideoProvider = 'youtube' | 'vimeo' | 'bunny';

export interface NormalizedVideo {
  provider: VideoProvider;
  videoId: string;
  embedUrl: string;
}

const stripLegacyCourseFields = (value: any) => {
  const { price, image, vodafoneNumber, month, shortDescription, fullDescription, ...current } = value;
  return current;
};

const userLevelId = (req: Request): string | null => {
  const level = req.user?.educationalLevel;
  return level?._id ? String(level._id) : level ? String(level) : null;
};

const errorResponse = (res: Response, error: any, fallback = 'حدث خطأ أثناء تحميل المحتوى') => {
  const statusCode = error?.statusCode || (error?.name === 'CastError' ? 400 : 500);
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message: error?.name === 'CastError' ? 'المعرّف غير صحيح' : error?.message || fallback
  });
};

const youtubeEmbed = (videoId: string) => `https://www.youtube.com/embed/${videoId}`;
const vimeoEmbed = (videoId: string) => `https://player.vimeo.com/video/${videoId}`;
const bunnyEmbed = (videoId: string) => {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || 'library';
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
};

const embedForProvider = (provider: VideoProvider, videoId: string) => {
  if (provider === 'youtube') return youtubeEmbed(videoId);
  if (provider === 'vimeo') return vimeoEmbed(videoId);
  return bunnyEmbed(videoId);
};

export const normalizeVideoSource = (source: string, provider?: VideoProvider, videoId?: string): NormalizedVideo => {
  const cleanId = videoId?.trim();
  if (provider && cleanId) {
    return {
      provider,
      videoId: cleanId,
      embedUrl: embedForProvider(provider, cleanId)
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(source.trim());
  } catch {
    throw new AppError('أدخل رابط فيديو صحيح من Bunny أو YouTube أو Vimeo', 400);
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  let detectedProvider: VideoProvider | null = null;
  let detectedId = '';

  if (host === 'youtu.be') {
    detectedProvider = 'youtube';
    detectedId = parsed.pathname.split('/').filter(Boolean)[0] || '';
  } else if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
    detectedProvider = 'youtube';
    detectedId = parsed.searchParams.get('v') || parsed.pathname.match(/\/(?:embed|shorts|v)\/([^/]+)/)?.[1] || '';
  } else if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    detectedProvider = 'vimeo';
    detectedId = parsed.pathname.match(/(?:video\/)?(\d+)/)?.[1] || '';
  } else if (host === 'iframe.mediadelivery.net' || host === 'player.mediadelivery.net') {
    detectedProvider = 'bunny';
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    detectedId = pathParts[pathParts.length - 1] || '';
  }

  if (!detectedProvider || !detectedId) {
    throw new AppError('الرابط يجب أن يكون من Bunny أو YouTube أو Vimeo', 400);
  }

  detectedId = detectedId.split(/[?#&]/)[0];
  return {
    provider: detectedProvider,
    videoId: detectedId,
    embedUrl: embedForProvider(detectedProvider, detectedId)
  };
};

const serializeLesson = (lesson: any, accessEnabled: boolean, revealVideo: boolean) => {
  const rawUrl = lesson.videoUrl || '';
  let video: NormalizedVideo | null = null;
  try {
    if (rawUrl || (lesson.videoProvider && lesson.videoId)) {
      video = normalizeVideoSource(rawUrl, lesson.videoProvider, lesson.videoId);
    }
  } catch {
    video = null;
  }

  return {
    id: String(lesson._id),
    _id: lesson._id,
    courseId: lesson.courseId,
    title: lesson.title,
    description: lesson.description || '',
    duration: lesson.duration || 0,
    order: lesson.order || 0,
    access: accessEnabled ? 'active' : 'locked',
    isLocked: !accessEnabled,
    videoProvider: video?.provider || lesson.videoProvider || null,
    videoId: video?.videoId || lesson.videoId || null,
    bunnyVideoId: lesson.bunnyVideoId || null,
    videoStatus: lesson.videoStatus || 'ready',
    videoUrl: revealVideo && accessEnabled ? video?.embedUrl || null : null
  };
};

const assertStudentCourseVisibility = (req: Request, course: any) => {
  if (!req.user || isContentManager(req.user)) return;
  if (!course.isActive) {
    throw new AppError('هذا الباب غير متاح حاليًا', 404);
  }
  if (!studentMatchesCourse(req.user, course)) {
    throw new AppError('هذا الباب غير متاح لصفك الدراسي', 403);
  }
};

export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, educationalLevel, term, isActive } = req.query;
    const query: any = {};
    const manager = isContentManager(req.user);

    if (manager && educationalLevel) query.educationalLevel = educationalLevel;
    if (!manager) {
      if (!req.user) throw new AppError('يجب تسجيل الدخول أولًا', 401);
      const levelId = userLevelId(req);
      if (!levelId) throw new AppError('لم يتم تحديد الصف الدراسي لهذا الحساب', 400);
      query.educationalLevel = levelId;
      query.isActive = true;
    } else if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (term === 'first' || term === 'second') query.term = term;

    const result: PaginationResult<any> = await paginate(
      Course,
      query,
      { page: Number(page), limit: Number(limit) },
      { order: 1, createdAt: 1 }
    );
    const courses = await Course.populate(result.data, { path: 'educationalLevel' });
    const courseAccess = !manager && req.user
      ? await Course.find({ _id: { $in: courses.map((course: any) => course._id) } }).select('_id').lean()
      : [];
    const activeAccess = !manager && req.user
      ? await (await import('../models/CourseAccess')).default.find({
        userId: req.user._id,
        courseId: { $in: courseAccess.map((course: any) => course._id) },
        enabled: true
      }).lean()
      : [];
    const activeIds = new Set(activeAccess.map((access: any) => String(access.courseId)));

    const data = await Promise.all(courses.map(async (course: any) => {
      const lessonCount = await Lesson.countDocuments({ courseId: course._id });
      const examCount = await Exam.countDocuments({ courseId: course._id, type: 'course', isActive: true });
      const serialized = stripLegacyCourseFields(course.toObject ? course.toObject() : course);
      return {
        ...serialized,
        id: String(course._id),
        description: course.description || course.shortDescription || '',
        access: manager || activeIds.has(String(course._id)) ? 'active' : 'locked',
        lessonCount,
        examCount
      };
    }));

    res.status(200).json({ status: 'success', data, pagination: result.pagination });
  } catch (error: any) {
    errorResponse(res, error);
  }
};

export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id).populate('educationalLevel');
    if (!course) throw new AppError('الباب غير موجود', 404);
    assertStudentCourseVisibility(req, course);

    const manager = isContentManager(req.user);
    const accessRecord = manager ? null : (req.user && await getCourseAccessRecord(req.user._id, course._id));
    const access = manager || Boolean(accessRecord?.enabled);
    const [lessonCount, examCount] = await Promise.all([
      Lesson.countDocuments({ courseId: course._id }),
      Exam.countDocuments({ courseId: course._id, type: 'course', isActive: true })
    ]);
    const serialized = stripLegacyCourseFields(course.toObject());
    res.status(200).json({
      status: 'success',
      data: {
        course: {
          ...serialized,
          id: String(course._id),
          description: course.description || course.shortDescription || '',
          access: access && course.isActive ? 'active' : 'locked',
          accessEnabled: access && course.isActive,
          lessonCount,
          examCount
        }
      }
    });
  } catch (error: any) {
    errorResponse(res, error, 'الباب غير موجود');
  }
};

export const getCourseLessons = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('الباب غير موجود', 404);
    assertStudentCourseVisibility(req, course);

    const result: PaginationResult<any> = await paginate(
      Lesson,
      { courseId: course._id },
      { page: Number(req.query.page), limit: Number(req.query.limit) },
      { order: 1, createdAt: 1 }
    );
    const manager = isContentManager(req.user);
    const accessMap = req.user
      ? await buildLessonAccessMap(req.user, result.data as any[])
      : new Map<string, boolean>();
    const lessons = result.data.map((lesson: any) => serializeLesson(
      lesson,
      Boolean(accessMap.get(String(lesson._id))),
      manager
    ));

    res.status(200).json({ status: 'success', data: lessons, pagination: result.pagination });
  } catch (error: any) {
    errorResponse(res, error);
  }
};

export const getLessonVideoUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError('يجب تسجيل الدخول أولًا', 401);
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) throw new AppError('الدرس غير موجود', 404);

    const course = await Course.findById(lesson.courseId).select('educationalLevel isActive');
    if (!course) throw new AppError('الباب غير موجود', 404);
    assertStudentCourseVisibility(req, course);
    if (!await getLessonAccess(req.user, lesson)) {
      throw new AppError('هذا الدرس مقفول حاليًا. اطلب تفعيله من المدرس.', 403);
    }

    const video = normalizeVideoSource(lesson.videoUrl || '', lesson.videoProvider, lesson.videoId);
    const videoUrl = video.provider === 'bunny'
      ? createBunnyEmbedUrl(video.videoId, Number(process.env.BUNNY_PLAYBACK_EXPIRY_SECONDS || 900))
      : video.embedUrl;
    res.status(200).json({
      status: 'success',
      data: {
        videoUrl,
        provider: video.provider,
        videoId: video.videoId,
        videoStatus: lesson.videoStatus || 'ready'
      }
    });
  } catch (error: any) {
    errorResponse(res, error, 'تعذر فتح الفيديو');
  }
};

export const recordVideoEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError('يجب تسجيل الدخول أولًا', 401);
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) throw new AppError('الدرس غير موجود', 404);
    const course = await Course.findById(lesson.courseId).select('educationalLevel isActive');
    if (!course) throw new AppError('الباب غير موجود', 404);
    assertStudentCourseVisibility(req, course);
    if (!await getLessonAccess(req.user, lesson)) {
      throw new AppError('هذا الدرس مقفول حاليًا. اطلب تفعيله من المدرس.', 403);
    }

    const {
      sessionId,
      event = 'timeupdate',
      positionSeconds = 0,
      durationSeconds = 0,
      watchedDeltaSeconds = 0
    } = req.body || {};
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 120) {
      throw new AppError('جلسة الفيديو غير صحيحة', 400);
    }

    const position = Math.max(0, Number(positionSeconds) || 0);
    const duration = Math.max(0, Number(durationSeconds) || 0);
    const watchedDelta = Math.min(60, Math.max(0, Number(watchedDeltaSeconds) || 0));
    const now = new Date();
    const existingSession = await VideoWatchSession.findOne({
      userId: req.user._id,
      lessonId: lesson._id,
      sessionId
    });
    let session = existingSession;
    let isNewSession = false;
    if (!session) {
      try {
        session = await VideoWatchSession.create({
          userId: req.user._id,
          lessonId: lesson._id,
          sessionId,
          watchedSeconds: 0,
          lastPositionSeconds: position,
          durationSeconds: duration,
          startedAt: now,
          lastWatchedAt: now
        });
        isNewSession = true;
      } catch (createError: any) {
        if (createError?.code !== 11000) throw createError;
        session = await VideoWatchSession.findOne({ userId: req.user._id, lessonId: lesson._id, sessionId });
        if (!session) throw createError;
      }
    }
    const nextWatched = Math.min(24 * 60 * 60, session.watchedSeconds + watchedDelta);
    const completionPercent = duration > 0
      ? Math.min(100, Math.round((position / duration) * 100))
      : 0;
    const completed = event === 'ended' || completionPercent >= 95;

    await VideoWatchSession.findByIdAndUpdate(session._id, {
      $set: {
        watchedSeconds: nextWatched,
        lastPositionSeconds: position,
        durationSeconds: Math.max(session.durationSeconds || 0, duration),
        lastWatchedAt: now,
        ...(completed ? { completedAt: now } : {})
      }
    });
    const progress = await VideoProgress.findOneAndUpdate(
      { userId: req.user._id, lessonId: lesson._id },
      {
        $set: {
          lastPositionSeconds: position,
          durationSeconds: Math.max(session.durationSeconds || 0, duration),
          completionPercent,
          lastWatchedAt: now,
          ...(completed ? { completedAt: now } : {})
        },
        $inc: {
          watchedSeconds: watchedDelta,
          ...(isNewSession ? { sessionCount: 1 } : {})
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ status: 'success', data: { progress } });
  } catch (error: any) {
    errorResponse(res, error, 'تعذر حفظ نشاط الفيديو');
  }
};
