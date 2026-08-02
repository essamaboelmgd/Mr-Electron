import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import { AppError } from '../middleware/errorHandler';
import Exam from '../models/Exam';
import Question from '../models/Question';
import Submission from '../models/Submission';
import ExamAttempt from '../models/ExamAttempt';
import Course from '../models/Course';
import CourseAccess from '../models/CourseAccess';
import { isContentManager, sameId } from '../services/accessService';
import { paginate, PaginationResult } from '../utils/pagination';

const currentUserId = (req: Request) => req.user?._id;

const userCanAccessExam = async (req: Request, exam: any): Promise<boolean> => {
  if (!req.user || isContentManager(req.user)) return true;
  if (!exam.isActive) return false;

  if (exam.type === 'general') {
    return sameId(req.user.educationalLevel, exam.educationalLevel);
  }

  if (!exam.courseId) return false;
  const course = await Course.findById(exam.courseId).select('educationalLevel isActive');
  if (!course || !course.isActive || !sameId(req.user.educationalLevel, course.educationalLevel)) return false;
  return Boolean(await CourseAccess.findOne({ userId: req.user._id, courseId: exam.courseId, enabled: true }).lean());
};

const reviewIsAvailable = (exam: any): boolean => {
  if (exam.reviewMode === 'open') return true;
  if (exam.reviewMode !== 'scheduled' || !exam.reviewReleaseAt) return false;
  return new Date(exam.reviewReleaseAt).getTime() <= Date.now();
};

const examPolicy = (exam: any) => ({
  maxAttempts: Math.max(1, Number(exam.maxAttempts) || 1),
  reviewMode: exam.reviewMode || 'closed',
  reviewReleaseAt: exam.reviewReleaseAt || null,
  reviewAvailable: reviewIsAvailable(exam)
});

const calculateScore = (questions: any[], answers: any[]) => {
  const validQuestionIds = new Set(questions.map((question) => String(question._id)));
  const answerMap = new Map(
    (Array.isArray(answers) ? answers : [])
      .filter((answer) => validQuestionIds.has(String(answer.questionId)))
      .map((answer) => [String(answer.questionId), String(answer.selectedOption)])
  );
  let score = 0;
  let totalMarks = 0;
  for (const question of questions) {
    totalMarks += Number(question.marks) || 0;
    if (answerMap.get(String(question._id)) === question.correct) score += Number(question.marks) || 0;
  }
  return {
    score,
    totalMarks,
    answers: Array.from(answerMap.entries()).map(([questionId, selectedOption]) => ({ questionId, selectedOption }))
  };
};

const percentageFor = (submission: any) => submission?.totalMarks
  ? (submission.score / submission.totalMarks) * 100
  : 0;

const serializeAttempt = (attempt: any) => {
  const expiresAt = attempt.expiresAt ? new Date(attempt.expiresAt) : null;
  return {
    _id: String(attempt._id),
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    answers: (attempt.answers || []).map((answer: any) => ({
      questionId: String(answer.questionId),
      selectedOption: answer.selectedOption
    })),
    currentQuestion: attempt.currentQuestion || 0,
    startedAt: attempt.startedAt,
    expiresAt,
    remainingSeconds: expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) : null,
    questionOrder: (attempt.questionOrder || []).map((questionId: any) => String(questionId)),
    optionOrder: (attempt.optionOrder || []).map((entry: any) => ({
      questionId: String(entry.questionId),
      optionIds: Array.isArray(entry.optionIds) ? entry.optionIds : []
    }))
  };
};

const getExamOrThrow = async (req: Request) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new AppError('الامتحان غير موجود', 404);
  if (!await userCanAccessExam(req, exam)) throw new AppError('هذا الامتحان غير متاح حاليًا', 403);
  return exam;
};

const getQuestionsForExam = (examId: string) => Question.find({
  examId,
  onModel: 'Exam'
}).sort({ order: 1 });

const shuffle = <T>(items: T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
};

const createAttemptOrdering = async (exam: any) => {
  const questions = await getQuestionsForExam(String(exam._id));
  const orderedQuestions = exam.shuffleQuestions ? shuffle(questions) : questions;
  return {
    questionOrder: orderedQuestions.map((question: any) => question._id),
    optionOrder: orderedQuestions.map((question: any) => ({
      questionId: question._id,
      optionIds: exam.shuffleOptions
        ? shuffle((question.options || []).map((option: any) => String(option.id)))
        : (question.options || []).map((option: any) => String(option.id))
    }))
  };
};

const orderQuestionsForAttempt = (questions: any[], attempt?: any) => {
  if (!attempt?.questionOrder?.length && !attempt?.optionOrder?.length) return questions;
  const byId = new Map(questions.map((question: any) => [String(question._id), question]));
  const ordered = (attempt.questionOrder || [])
    .map((questionId: any) => byId.get(String(questionId)))
    .filter(Boolean);
  const seen = new Set(ordered.map((question: any) => String(question._id)));
  questions.forEach((question: any) => {
    if (!seen.has(String(question._id))) ordered.push(question);
  });

  const optionOrder = new Map<string, string[]>((attempt.optionOrder || []).map((entry: any) => [
    String(entry.questionId),
    Array.isArray(entry.optionIds) ? entry.optionIds.map((optionId: any) => String(optionId)) : []
  ] as [string, string[]]));
  return ordered.map((question: any) => {
    const ids = optionOrder.get(String(question._id));
    if (!ids?.length || !question.options?.length) return question;
    const optionsById = new Map(question.options.map((option: any) => [String(option.id), option]));
    const options = ids.map((optionId: string) => optionsById.get(optionId)).filter(Boolean);
    const existing = new Set(options.map((option: any) => String(option.id)));
    question.options.forEach((option: any) => {
      if (!existing.has(String(option.id))) options.push(option);
    });
    return { ...question.toObject(), options };
  });
};

const ensureAttemptOrdering = async (exam: any, attempt: any) => {
  if (attempt.questionOrder?.length || attempt.optionOrder?.length) return attempt;
  const ordering = await createAttemptOrdering(exam);
  return ExamAttempt.findByIdAndUpdate(attempt._id, { $set: ordering }, { new: true });
};

const latestSubmission = (userId: unknown, examId: string) => Submission.findOne({
  userId,
  examId,
  onModel: 'Exam'
}).sort({ submittedAt: -1 });

const serializeStudentExamState = (exam: any, submissions: any[]) => {
  const latest = submissions[0];
  const reviewedSubmission = submissions.find((submission) => Boolean(submission.reviewedAt));
  const maxAttempts = Math.max(1, Number(exam.maxAttempts) || 1);
  const reviewAvailable = reviewIsAvailable(exam);
  return {
    attemptsCount: submissions.length,
    latestAttempt: latest ? {
      id: String(latest._id),
      attemptNumber: latest.attemptNumber || submissions.length,
      score: latest.score || 0,
      totalMarks: latest.totalMarks || 0,
      percentage: percentageFor(latest),
      submittedAt: latest.submittedAt,
      reviewedAt: latest.reviewedAt || null
    } : undefined,
    reviewAttemptId: reviewedSubmission ? String(reviewedSubmission._id) : latest ? String(latest._id) : undefined,
    reviewed: Boolean(reviewedSubmission),
    reviewAvailable,
    canReview: Boolean(latest && reviewAvailable),
    canRetake: submissions.length < maxAttempts && !reviewedSubmission
  };
};

const startAttempt = async (req: Request, exam: any) => {
  const userId = currentUserId(req);
  const active = await ExamAttempt.findOne({ userId, examId: exam._id, status: 'in_progress' }).sort({ createdAt: -1 });
  if (active) {
    if (active.expiresAt && active.expiresAt.getTime() <= Date.now()) {
      await finalizeAttempt(req, exam, active, active.answers, 'auto');
    } else {
      return ensureAttemptOrdering(exam, active);
    }
  }

  const completedAttempts = await Submission.countDocuments({ userId, examId: exam._id, onModel: 'Exam' });
  const reviewedSubmission = await Submission.exists({
    userId,
    examId: exam._id,
    onModel: 'Exam',
    reviewedAt: { $exists: true, $ne: null }
  });
  if (reviewedSubmission) {
    throw new AppError('بعد مراجعة الإجابات لا يمكن إعادة هذا الامتحان.', 400);
  }
  const maxAttempts = Math.max(1, Number(exam.maxAttempts) || 1);
  if (completedAttempts >= maxAttempts) {
    throw new AppError('استنفدت عدد المحاولات المسموح بها لهذا الامتحان.', 400);
  }

  const startedAt = new Date();
  const expiresAt = Number(exam.timeLimitMin) > 0
    ? new Date(startedAt.getTime() + Number(exam.timeLimitMin) * 60 * 1000)
    : null;
  const ordering = await createAttemptOrdering(exam);
  return ExamAttempt.create({
    userId,
    examId: exam._id,
    attemptNumber: completedAttempts + 1,
    status: 'in_progress',
    answers: [],
    currentQuestion: 0,
    startedAt,
    expiresAt,
    ...ordering
  });
};

const finalizeAttempt = async (
  req: Request,
  exam: any,
  attempt: any,
  answers: any[],
  reason: 'manual' | 'auto'
) => {
  const existing = await Submission.findOne({ attemptId: attempt._id, onModel: 'Exam' });
  if (existing) return existing;

  const questions = await getQuestionsForExam(String(exam._id));
  const result = calculateScore(questions, answers);
  const submittedAt = new Date();
  await ExamAttempt.findByIdAndUpdate(attempt._id, {
    $set: {
      status: reason === 'auto' ? 'expired' : 'submitted',
      answers: result.answers,
      submittedAt,
      submittedReason: reason,
      score: result.score,
      totalMarks: result.totalMarks
    }
  });

  try {
    return await Submission.create({
      userId: currentUserId(req),
      examId: exam._id,
      onModel: 'Exam',
      attemptId: attempt._id,
      attemptNumber: attempt.attemptNumber,
      answers: result.answers,
      score: result.score,
      totalMarks: result.totalMarks,
      submittedAt,
      submittedReason: reason,
      isGraded: true,
      gradedAt: submittedAt
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      const duplicate = await Submission.findOne({ attemptId: attempt._id, onModel: 'Exam' });
      if (duplicate) return duplicate;
    }
    throw error;
  }
};

// Get all exams with pagination. Content managers receive the admin view;
// students are narrowed to their own grade and enabled chapters.
export const getExams = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user && !isContentManager(req.user)) {
      await getUserExams(req, res);
      return;
    }
    const { page, limit, courseId, lessonId, type, isActive, educationalLevel } = req.query;
    const query: any = {};
    if (courseId) query.courseId = courseId;
    if (lessonId) query.lessonId = lessonId;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (type === 'general' && educationalLevel) query.educationalLevel = educationalLevel;

    const result: PaginationResult<any> = await paginate(
      Exam,
      query,
      { page: Number(page), limit: Number(limit) },
      { date: -1, createdAt: -1 }
    );
    res.status(200).json({ status: 'success', data: result.data, pagination: result.pagination });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Server Error'
    });
  }
};

export const getUserExams = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError('يجب تسجيل الدخول أولًا', 401);
    const { page, limit, type, courseId } = req.query;
    const levelId = req.user.educationalLevel?._id || req.user.educationalLevel;
    const activeCourses = await CourseAccess.find({ userId: req.user._id, enabled: true }).distinct('courseId');
    const query: any = { isActive: true };

    if (type === 'general') {
      query.type = 'general';
      query.educationalLevel = levelId;
    } else if (type === 'course') {
      query.type = 'course';
      query.courseId = { $in: activeCourses };
      if (courseId && activeCourses.some((id: any) => String(id) === String(courseId))) query.courseId = courseId;
    } else {
      query.$or = [
        { type: 'general', educationalLevel: levelId },
        { type: 'course', courseId: { $in: activeCourses } }
      ];
    }

    const result: PaginationResult<any> = await paginate(
      Exam,
      query,
      { page: Number(page), limit: Number(limit) },
      { createdAt: -1 }
    );
    const data = await Exam.populate(result.data, { path: 'courseId', select: 'title term order educationalLevel' });
    const examIds = data.map((exam: any) => exam._id);
    const submissions = await Submission.find({
      userId: req.user._id,
      examId: { $in: examIds },
      onModel: 'Exam'
    }).sort({ submittedAt: -1 }).lean();
    const submissionsByExam = new Map<string, any[]>();
    submissions.forEach((submission: any) => {
      const key = String(submission.examId);
      const current = submissionsByExam.get(key) || [];
      current.push(submission);
      submissionsByExam.set(key, current);
    });
    const serialized = data.map((exam: any) => {
      const plainExam = exam.toObject ? exam.toObject() : exam;
      return {
        ...plainExam,
        studentState: serializeStudentExamState(exam, submissionsByExam.get(String(exam._id)) || [])
      };
    });
    res.status(200).json({ status: 'success', data: serialized, pagination: result.pagination });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Server Error'
    });
  }
};

export const getExamById = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await getExamOrThrow(req);
    res.status(200).json({ status: 'success', data: { exam, policy: examPolicy(exam) } });
  } catch (error: any) {
    res.status(error.statusCode || (error.name === 'CastError' ? 400 : 500)).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.name === 'CastError' ? 'المعرّف غير صحيح' : error.message || 'Server Error'
    });
  }
};

export const getExamQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await getExamOrThrow(req);
    const wantsReview = req.query.review === 'true';
    let canReview = isContentManager(req.user);
    let ownedSubmission: any = null;
    let attempt: any = null;
    if (wantsReview && !canReview) {
      if (!reviewIsAvailable(exam)) throw new AppError('مراجعة الإجابات غير متاحة حاليًا.', 403);
      const submission = req.query.attemptId
        ? await Submission.findOne({ _id: req.query.attemptId, userId: req.user?._id, examId: exam._id, onModel: 'Exam' })
        : await latestSubmission(req.user?._id, String(exam._id));
      ownedSubmission = submission;
      canReview = Boolean(ownedSubmission);
      if (!ownedSubmission) throw new AppError('لم يتم العثور على نتيجة لهذا الامتحان.', 404);
      attempt = ownedSubmission.attemptId
        ? await ExamAttempt.findOne({ _id: ownedSubmission.attemptId, userId: req.user?._id, examId: exam._id })
        : null;
    }

    if (!wantsReview && req.query.attemptId && !isContentManager(req.user)) {
      attempt = await ExamAttempt.findOne({ _id: req.query.attemptId, userId: req.user?._id, examId: exam._id });
      if (!attempt) throw new AppError('محاولة الامتحان غير موجودة.', 404);
    }

    const questions = orderQuestionsForAttempt(await getQuestionsForExam(String(exam._id)), attempt);

    if (wantsReview && ownedSubmission && !ownedSubmission.reviewedAt) {
      ownedSubmission.reviewedAt = new Date();
      await ownedSubmission.save();
    }

    const safeQuestions = canReview
      ? questions
      : questions.map((question: any) => {
        const data = question.toObject ? question.toObject() : { ...question };
        delete data.correct;
        delete data.explanation;
        return data;
      });
    res.status(200).json({ status: 'success', data: { questions: safeQuestions, reviewAvailable: reviewIsAvailable(exam) } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Server Error'
    });
  }
};

export const startExamAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await getExamOrThrow(req);
    const attempt = await startAttempt(req, exam);
    res.status(200).json({ status: 'success', data: { attempt: serializeAttempt(attempt), policy: examPolicy(exam) } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر بدء الامتحان'
    });
  }
};

const getOwnedAttempt = async (req: Request) => {
  const attempt = await ExamAttempt.findOne({
    _id: req.params.attemptId,
    userId: currentUserId(req),
    examId: req.params.id
  });
  if (!attempt) throw new AppError('محاولة الامتحان غير موجودة.', 404);
  return attempt;
};

export const saveExamAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await getExamOrThrow(req);
    const attempt = await getOwnedAttempt(req);
    if (attempt.status !== 'in_progress') throw new AppError('هذه المحاولة انتهت بالفعل.', 400);
    if (attempt.expiresAt && attempt.expiresAt.getTime() <= Date.now()) {
      const submission = await finalizeAttempt(req, exam, attempt, attempt.answers, 'auto');
      throw new AppError(`انتهى وقت الامتحان. تم التسليم بدرجة ${submission.score} من ${submission.totalMarks}.`, 400);
    }
    const questions = await getQuestionsForExam(String(exam._id));
    const calculated = calculateScore(questions, req.body?.answers || attempt.answers);
    const currentQuestion = Math.max(0, Number(req.body?.currentQuestion) || 0);
    const updated = await ExamAttempt.findByIdAndUpdate(attempt._id, {
      $set: { answers: calculated.answers, currentQuestion }
    }, { new: true });
    res.status(200).json({ status: 'success', data: { attempt: serializeAttempt(updated) } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر حفظ تقدم الامتحان'
    });
  }
};

export const submitExamAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await getExamOrThrow(req);
    const attempt = await getOwnedAttempt(req);
    if (attempt.status !== 'in_progress') {
      const previous = await Submission.findOne({ attemptId: attempt._id, onModel: 'Exam' });
      if (previous) {
        res.status(200).json({ status: 'success', data: { submission: previous, score: previous.score, totalMarks: previous.totalMarks } });
        return;
      }
      throw new AppError('هذه المحاولة انتهت بالفعل.', 400);
    }
    const timedOut = Boolean(attempt.expiresAt && attempt.expiresAt.getTime() <= Date.now());
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : attempt.answers;
    const submission = await finalizeAttempt(req, exam, attempt, answers, timedOut ? 'auto' : 'manual');
    res.status(201).json({ status: 'success', data: { submission, score: submission.score, totalMarks: submission.totalMarks } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تسليم الامتحان'
    });
  }
};

export const getExamAttempts = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await getExamOrThrow(req);
    const attempts = await Submission.find({ userId: currentUserId(req), examId: exam._id, onModel: 'Exam' })
      .sort({ submittedAt: -1 })
      .lean();
    res.status(200).json({
      status: 'success',
      data: {
        attempts: attempts.map((submission: any) => ({
          ...submission,
          percentage: percentageFor(submission),
          isPassed: percentageFor(submission) >= 50
        })),
        policy: examPolicy(exam)
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تحميل محاولات الامتحان'
    });
  }
};

// Kept as a compatibility bridge for an older student bundle.
export const submitExamAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await getExamOrThrow(req);
    const attempt = await startAttempt(req, exam);
    const submission = await finalizeAttempt(req, exam, attempt, req.body?.answers || [], 'manual');
    res.status(201).json({ status: 'success', data: { submission, score: submission.score, totalMarks: submission.totalMarks } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تسليم الامتحان'
    });
  }
};

export const getExamResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await getExamOrThrow(req);
    const submissions = await Submission.find({ userId: currentUserId(req), examId: exam._id, onModel: 'Exam' })
      .sort({ submittedAt: -1 })
      .lean();
    if (!submissions.length) throw new AppError('لم يتم حل هذا الامتحان بعد.', 404);
    const selected = req.query.attemptId
      ? submissions.find((submission: any) => String(submission._id) === String(req.query.attemptId))
      : submissions[0];
    if (!selected) throw new AppError('المحاولة غير موجودة.', 404);
    const percentage = percentageFor(selected);
    res.status(200).json({
      status: 'success',
      data: {
        submission: selected,
        percentage,
        isPassed: percentage >= 50,
        attempts: submissions.map((submission: any) => ({
          ...submission,
          percentage: percentageFor(submission),
          isPassed: percentageFor(submission) >= 50
        })),
        reviewed: submissions.some((submission: any) => Boolean(submission.reviewedAt)),
        reviewedAt: submissions.find((submission: any) => Boolean(submission.reviewedAt))?.reviewedAt || null,
        reviewAttemptId: submissions.find((submission: any) => Boolean(submission.reviewedAt))?._id || submissions[0]._id,
        policy: examPolicy(exam)
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تحميل النتيجة'
    });
  }
};
