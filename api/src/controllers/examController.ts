import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import Exam from '../models/Exam';
import Question from '../models/Question';
import Submission from '../models/Submission';
import Course from '../models/Course';
import CourseAccess from '../models/CourseAccess';
import { isContentManager, sameId } from '../services/accessService';
import { paginate, PaginationResult } from '../utils/pagination';

// Get all exams with pagination
export const getExams = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user && !isContentManager(req.user)) {
      await getUserExams(req, res);
      return;
    }
    const { page, limit, courseId, lessonId, type, isActive, educationalLevel } = req.query;
    
    // Build query
    const query: any = {};
    if (courseId) query.courseId = courseId;
    if (lessonId) query.lessonId = lessonId;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // For general exams, filter by educational level if provided
    if (type === 'general' && educationalLevel) query.educationalLevel = educationalLevel;
    
    // Paginate results
    const result: PaginationResult<any> = await paginate(
      Exam,
      query,
      { page: Number(page), limit: Number(limit) },
      { date: -1 }
    );
    
    res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Server Error'
    });
  }
};

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

// Get exams for a user based on direct chapter access and their educational level.
export const getUserExams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, type } = req.query;
    if (!req.user) throw new AppError('يجب تسجيل الدخول أولًا', 401);

    const levelId = req.user.educationalLevel?._id || req.user.educationalLevel;
    const activeCourses = await CourseAccess.find({ userId: req.user._id, enabled: true }).distinct('courseId');
    const query: any = { isActive: true };

    if (type === 'general') {
      query.type = 'general';
      query.educationalLevel = levelId;
    } else if (type === 'course') {
      query.type = 'course';
      query.courseId = { $in: activeCourses };
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
    const data = await Exam.populate(result.data, {
      path: 'courseId',
      select: 'title term order educationalLevel'
    });
    res.status(200).json({
      status: 'success',
      data,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Get exam by ID
export const getExamById = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    if (!await userCanAccessExam(req, exam)) {
      throw new AppError('هذا الامتحان غير متاح حاليًا', 403);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        exam
      }
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid exam ID'
      });
    } else {
      res.status(error.statusCode || 500).json({
        status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Get questions for an exam
export const getExamQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if exam exists and is visible to this student.
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    if (!await userCanAccessExam(req, exam)) {
      throw new AppError('هذا الامتحان غير متاح حاليًا', 403);
    }
    
    // A student receives question choices during the attempt. Correct answers
    // are only revealed after a submitted attempt requests a review.
    const questions = await Question.find({ 
      examId: req.params.id,
      onModel: 'Exam'
    }).sort({ order: 1 });
    const canReview = Boolean(req.user && !isContentManager(req.user) && req.query.review === 'true'
      && await Submission.findOne({ userId: req.user._id, examId: req.params.id, onModel: 'Exam' }));
    const safeQuestions = canReview || isContentManager(req.user)
      ? questions
      : questions.map((question: any) => {
        const data = question.toObject();
        delete data.correct;
        delete data.explanation;
        return data;
      });
    
    res.status(200).json({
      status: 'success',
      data: {
        questions: safeQuestions
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Submit exam answers
export const submitExamAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { answers } = req.body;
    
    // Check if exam exists
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    if (!await userCanAccessExam(req, exam)) {
      throw new AppError('هذا الامتحان غير متاح حاليًا', 403);
    }
    
    // Check if user has already submitted this exam
    const existingSubmission = await Submission.findOne({
      userId: req.user._id,
      examId: req.params.id,
      onModel: 'Exam'
    });
    
    // If there's an existing submission, check if the student passed
    if (existingSubmission) {
      // Calculate if the student passed (50% or higher)
      const percentage = existingSubmission.totalMarks
        ? (existingSubmission.score / existingSubmission.totalMarks) * 100
        : 0;
      const isPassed = percentage >= 50;
      
      // If student passed, don't allow retake
      if (isPassed) {
        throw new AppError('You have already passed this exam', 400);
      }
      // If student failed, we allow retake by continuing with the submission
    }
    
    // Get questions for this exam
    const questions = await Question.find({ 
      examId: req.params.id,
      onModel: 'Exam'
    });
    
    // Validate answers
    if (!answers || !Array.isArray(answers)) {
      throw new AppError('Answers are required', 400);
    }
    
    // Calculate score based on individual question marks
    let score = 0;
    let totalMarks = 0;
    
    // Calculate total marks from questions
    for (const question of questions) {
      totalMarks += question.marks;
    }
    
    // Calculate score based on correct answers
    for (const answer of answers) {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      if (question && question.correct === answer.selectedOption) {
        score += question.marks;
      }
    }
    
    let submission;
    
    // If there's an existing submission and student failed, update it
    if (existingSubmission) {
      submission = await Submission.findByIdAndUpdate(
        existingSubmission._id,
        {
          answers,
          score,
          totalMarks,
          submittedAt: new Date(),
          isGraded: true,
          gradedAt: new Date()
        },
        { new: true }
      );
    } else {
      // Create new submission
      submission = await Submission.create({
        userId: req.user._id,
        examId: req.params.id,
        onModel: 'Exam',
        answers,
        score,
        totalMarks,
        submittedAt: new Date(),
        isGraded: true,
        gradedAt: new Date()
      });
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        submission,
        score,
        totalMarks
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Get exam results
export const getExamResults = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if exam exists
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    if (!await userCanAccessExam(req, exam)) {
      throw new AppError('هذا الامتحان غير متاح حاليًا', 403);
    }
    
    // Get submission
    const submission = await Submission.findOne({
      userId: req.user._id,
      examId: req.params.id,
      onModel: 'Exam'
    });
    
    if (!submission) {
      throw new AppError('No submission found for this exam', 404);
    }
    
    // Calculate if the student passed (50% or higher)
    const percentage = submission.totalMarks ? (submission.score / submission.totalMarks) * 100 : 0;
    const isPassed = percentage >= 50;
    
    res.status(200).json({
      status: 'success',
      data: {
        submission,
        percentage,
        isPassed
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Server Error'
    });
  }
};
