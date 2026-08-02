import mongoose from 'mongoose';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import CourseAccess from '../models/CourseAccess';
import LessonAccess from '../models/LessonAccess';

type UserLike = {
  _id: mongoose.Types.ObjectId | string;
  role: string;
  educationalLevel?: mongoose.Types.ObjectId | string | { _id: mongoose.Types.ObjectId | string } | null;
};

const idOf = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
};

export const isContentManager = (user?: UserLike | null): boolean =>
  Boolean(user && ['admin', 'teacher', 'assistant'].includes(user.role));

export const sameId = (left: unknown, right: unknown): boolean =>
  Boolean(idOf(left) && idOf(right) && idOf(left) === idOf(right));

export const studentMatchesCourse = (user: UserLike, course: { educationalLevel: unknown }): boolean =>
  isContentManager(user) || sameId(user.educationalLevel, course.educationalLevel);

export const hasCourseAccess = async (user: UserLike, courseId: string): Promise<boolean> => {
  if (isContentManager(user)) return true;

  const course = await Course.findById(courseId).select('educationalLevel isActive');
  if (!course || !course.isActive || !studentMatchesCourse(user, course)) return false;

  const access = await CourseAccess.findOne({ userId: user._id, courseId, enabled: true }).lean();
  return Boolean(access);
};

export const getLessonAccess = async (user: UserLike, lesson: { _id: unknown; courseId: unknown }): Promise<boolean> => {
  if (isContentManager(user)) return true;

  const course = await Course.findById(lesson.courseId).select('educationalLevel isActive');
  if (!course || !course.isActive || !studentMatchesCourse(user, course)) return false;

  const courseAccess = await CourseAccess.findOne({ userId: user._id, courseId: lesson.courseId, enabled: true }).lean();
  if (!courseAccess) return false;

  const lessonOverride = await LessonAccess.findOne({ userId: user._id, lessonId: lesson._id }).lean();
  return lessonOverride ? lessonOverride.enabled : true;
};

export const buildLessonAccessMap = async (user: UserLike, lessons: Array<{ _id: unknown; courseId: unknown }>) => {
  if (isContentManager(user)) {
    return new Map(lessons.map((lesson) => [String(lesson._id), true]));
  }

  if (!lessons.length) return new Map<string, boolean>();
  const courseId = lessons[0].courseId;
  const course = await Course.findById(courseId).select('educationalLevel isActive').lean();
  const courseEnabled = Boolean(course && course.isActive && studentMatchesCourse(user, course));
  const courseAccess = courseEnabled
    ? await CourseAccess.findOne({ userId: user._id, courseId, enabled: true }).lean()
    : null;
  const overrides = await LessonAccess.find({
    userId: user._id,
    lessonId: { $in: lessons.map((lesson) => lesson._id) }
  }).lean();
  const overrideMap = new Map(overrides.map((item) => [String(item.lessonId), item.enabled]));

  return new Map(lessons.map((lesson) => {
    const override = overrideMap.get(String(lesson._id));
    return [String(lesson._id), Boolean(courseAccess && (override === undefined ? true : override))];
  }));
};

export const getCourseAccessRecord = async (userId: unknown, courseId: unknown) =>
  CourseAccess.findOne({ userId, courseId }).lean();

export const getLessonAccessRecord = async (userId: unknown, lessonId: unknown) =>
  LessonAccess.findOne({ userId, lessonId }).lean();

export const courseIdForLesson = async (lessonId: string) => {
  const lesson = await Lesson.findById(lessonId).select('courseId').lean();
  return lesson?.courseId ? String(lesson.courseId) : null;
};
