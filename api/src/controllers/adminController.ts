import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import Course from '../models/Course';
import Exam from '../models/Exam';
import Assignment from '../models/Assignment';
import Question from '../models/Question';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Lesson from '../models/Lesson';
import EducationalLevel from '../models/EducationalLevel';
import CourseAccess from '../models/CourseAccess';
import LessonAccess from '../models/LessonAccess';
import Note from '../models/Note';
import NoteOrder from '../models/NoteOrder';
import Submission from '../models/Submission';
import VideoProgress from '../models/VideoProgress';
import { Types } from 'mongoose';
import { paginate, PaginationResult } from '../utils/pagination';
import { extractPublicId, deleteImage } from '../services/cloudinaryService';
import { normalizeVideoSource } from './courseController';
import { createBunnyUploadSession, isBunnyConfigured } from '../services/bunnyService';

// Admin middleware to check if user is admin
export const requireAdmin = (req: Request, res: Response, next: any) => {
  if (!['admin', 'teacher', 'assistant'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admins only.'
    });
  }
  next();
};

// Create a new course
export const createCourse = async (req: any, res: Response): Promise<void> => {
  try {
    const { title, educationalLevel, term = 'first', description = '', order = 0, isActive = true } = req.body;
    const course = await Course.create({ title, educationalLevel, term, description, order, isActive });
    
    res.status(201).json({
      status: 'success',
      data: {
        course
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else {
      res.status(error.statusCode || 500).json({
        status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Update a course
export const updateCourse = async (req: any, res: Response): Promise<void> => {
  try {
    const allowedFields = ['title', 'educationalLevel', 'term', 'description', 'order', 'isActive'];
    const payload = Object.fromEntries(allowedFields
      .filter((field) => req.body[field] !== undefined)
      .map((field) => [field, req.body[field]]));
    const course = await Course.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        course
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid course ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Delete a course
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    
    // Delete image from Cloudinary if it exists
    if (course.image) {
      const publicId = extractPublicId(course.image);
      if (publicId) {
        // Wait for image deletion to complete before proceeding
        await deleteImage(publicId);
      }
    }
    
    // Capture lesson ids before removing the lessons so their access overrides
    // do not remain as orphaned records.
    const lessonIds = await Lesson.find({ courseId: req.params.id }).distinct('_id');

    // Delete the course and related items
    await Course.findByIdAndDelete(req.params.id);
    
    // Also delete related exams, assignments, and lessons
    await Exam.deleteMany({ courseId: req.params.id });
    await Assignment.deleteMany({ courseId: req.params.id });
    await Lesson.deleteMany({ courseId: req.params.id });
    await CourseAccess.deleteMany({ courseId: req.params.id });
    await LessonAccess.deleteMany({ lessonId: { $in: lessonIds } });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid course ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Create an exam
export const createExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      type,
      courseId = null,
      educationalLevel = null,
      timeLimitMin = 0,
      isActive = true,
      maxAttempts = 1,
      reviewMode = 'closed',
      reviewReleaseAt = null
    } = req.body;
    if (!['general', 'course'].includes(type)) {
      throw new AppError('نوع الامتحان يجب أن يكون عامًا أو خاصًا بباب', 400);
    }
    if (type === 'general' && !educationalLevel) {
      throw new AppError('الامتحان العام يحتاج إلى صف دراسي', 400);
    }
    if (type === 'course' && !courseId) {
      throw new AppError('امتحان الباب يحتاج إلى باب', 400);
    }
    if (!['closed', 'open', 'scheduled'].includes(reviewMode)) {
      throw new AppError('إعداد مراجعة الإجابات غير صحيح', 400);
    }
    if (reviewMode === 'scheduled' && !reviewReleaseAt) {
      throw new AppError('حدد موعد فتح المراجعة أو اختر فتحًا يدويًا', 400);
    }
    if (Number(maxAttempts) < 1) {
      throw new AppError('عدد المحاولات يجب أن يكون واحدًا على الأقل', 400);
    }
    const exam = await Exam.create({ title, type, courseId: type === 'course' ? courseId : null,
      educationalLevel: type === 'general' ? educationalLevel : null,
      timeLimitMin,
      isActive,
      maxAttempts: Math.floor(Number(maxAttempts) || 1),
      reviewMode,
      reviewReleaseAt: reviewMode === 'scheduled' ? reviewReleaseAt : null
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        exam
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else {
      res.status(error.statusCode || 500).json({
        status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Update an exam
export const updateExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const allowedFields = ['title', 'type', 'courseId', 'educationalLevel', 'timeLimitMin', 'isActive', 'maxAttempts', 'reviewMode', 'reviewReleaseAt'];
    const payload: any = Object.fromEntries(allowedFields
      .filter((field) => req.body[field] !== undefined)
      .map((field) => [field, req.body[field]]));
    if (payload.maxAttempts !== undefined && Number(payload.maxAttempts) < 1) {
      throw new AppError('عدد المحاولات يجب أن يكون واحدًا على الأقل', 400);
    }
    if (payload.reviewMode !== undefined && !['closed', 'open', 'scheduled'].includes(payload.reviewMode)) {
      throw new AppError('إعداد مراجعة الإجابات غير صحيح', 400);
    }
    if (payload.reviewMode === 'scheduled' && !payload.reviewReleaseAt) {
      throw new AppError('حدد موعد فتح المراجعة أو اختر فتحًا يدويًا', 400);
    }
    if (payload.reviewMode && payload.reviewMode !== 'scheduled') payload.reviewReleaseAt = null;
    if (payload.maxAttempts !== undefined) payload.maxAttempts = Math.floor(Number(payload.maxAttempts));
    const exam = await Exam.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        exam
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid exam ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Delete an exam
export const deleteExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    
    // Also delete related questions
    await Question.deleteMany({ examId: req.params.id, onModel: 'Exam' });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid exam ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Create an assignment
export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        assignment
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Update an assignment
export const updateAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        assignment
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid assignment ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Delete an assignment
export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }
    
    // Also delete related questions
    await Question.deleteMany({ examId: req.params.id, onModel: 'Assignment' });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid assignment ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Create a question
export const createQuestion = async (req: any, res: Response): Promise<void> => {
  try {
    // If an image was uploaded, use the Cloudinary URL
    if (req.file) {
      req.body.content = (req.file as any).path; // Cloudinary URL
    }
    
    // Use onModel from request body, default to Exam for backward compatibility
    const questionData = {
      ...req.body,
      onModel: req.body.onModel || 'Exam'
    };
    
    const question = await Question.create(questionData);
    
    // Update exam/assignment total marks based on onModel
    await updateExamTotalMarks(question.examId.toString(), questionData.onModel);
    
    res.status(201).json({
      status: 'success',
      data: {
        question
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Update a question
export const updateQuestion = async (req: any, res: Response): Promise<void> => {
  try {
    // If an image was uploaded, use the Cloudinary URL
    if (req.file) {
      req.body.content = (req.file as any).path; // Cloudinary URL
    }
    
    // First, get the existing question to check its onModel
    const existingQuestion = await Question.findById(req.params.id);
    if (!existingQuestion) {
      throw new AppError('Question not found', 404);
    }
    
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!question) {
      throw new AppError('Question not found', 404);
    }
    
    // Update exam/assignment total marks based on onModel
    await updateExamTotalMarks(question.examId.toString(), existingQuestion.onModel);
    
    res.status(200).json({
      status: 'success',
      data: {
        question
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid question ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Delete a question
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    // First, get the existing question to check its onModel
    const existingQuestion = await Question.findById(req.params.id);
    if (!existingQuestion) {
      throw new AppError('Question not found', 404);
    }
    
    const question = await Question.findByIdAndDelete(req.params.id);
    
    if (!question) {
      throw new AppError('Question not found', 404);
    }
    
    // Update exam/assignment total marks based on onModel
    await updateExamTotalMarks(question.examId.toString(), existingQuestion.onModel);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid question ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Helper function to update exam/assignment total marks based on questions
const updateExamTotalMarks = async (examId: string, onModel: 'Exam' | 'Assignment' = 'Exam') => {
  try {
    // Get all questions for this exam/assignment
    const questions = await Question.find({ examId, onModel });
    
    // Calculate total marks
    const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
    
    // Update exam/assignment total marks
    if (onModel === 'Exam') {
      await Exam.findByIdAndUpdate(examId, { totalMarks });
    } else {
      await Assignment.findByIdAndUpdate(examId, { totalMarks });
    }
  } catch (error) {
    console.error('Error updating exam/assignment total marks:', error);
  }
};

// Get all users (for admin panel)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, educationalLevel, role = 'student', page = 1, limit = 20 } = req.query;
    const query: any = {};
    if (role !== 'all') query.role = role;
    if (educationalLevel) query.educationalLevel = educationalLevel;
    if (search) {
      const pattern = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: pattern }, { phone: pattern }];
    }
    const result: PaginationResult<any> = await paginate(
      User,
      query,
      { page: Number(page), limit: Number(limit) },
      { createdAt: -1 }
    );
    const populated = await User.populate(result.data, { path: 'educationalLevel', select: 'name nameAr level year order' });
    const users = populated.map((user: any) => {
      const data = user.toObject ? user.toObject() : { ...user };
      delete data.password;
      return data;
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        users
      },
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Get all exams (for admin panel) with pagination
export const getAllExams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query: any = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.courseId) query.courseId = req.query.courseId;
    if (req.query.educationalLevel) query.educationalLevel = req.query.educationalLevel;
    
    const result: PaginationResult<any> = await paginate(
      Exam,
      query,
      { page: Number(page), limit: Number(limit) },
      { createdAt: -1 }
    );
    const populatedData = await Exam.populate(result.data, [
      { path: 'courseId', select: 'title term educationalLevel' },
      { path: 'educationalLevel', select: 'nameAr name level year' }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: populatedData,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Get all assignments (for admin panel) with pagination
export const getAllAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const result: PaginationResult<any> = await paginate(
      Assignment,
      {},
      { page: Number(page), limit: Number(limit) },
      { createdAt: -1 }
    );
    
    res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Get all notes (for admin panel)
export const getAllNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const result: PaginationResult<any> = await paginate(
      Note,
      {},
      { page: Number(page), limit: Number(limit) },
      { createdAt: -1 }
    );
    
    res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Create a note (for admin panel)
export const createNote = async (req: any, res: Response): Promise<void> => {
  try {
    // If an image was uploaded, use the Cloudinary URL
    if (req.file) {
      req.body.image = (req.file as any).path; // Cloudinary URL
    }
    
    const note = await Note.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        note
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Update a note (for admin panel)
export const updateNote = async (req: any, res: Response): Promise<void> => {
  try {
    // If an image was uploaded, use the Cloudinary URL
    if (req.file) {
      req.body.image = (req.file as any).path; // Cloudinary URL
    }
    
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!note) {
      throw new AppError('Note not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        note
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid note ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Delete a note (for admin panel)
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      throw new AppError('Note not found', 404);
    }
    
    // Delete image from Cloudinary if it exists
    if (note.image) {
      const publicId = extractPublicId(note.image);
      if (publicId) {
        // Wait for image deletion to complete before proceeding
        await deleteImage(publicId);
      }
    }
    
    // Delete the note
    await Note.findByIdAndDelete(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid note ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Get all note orders (for admin panel)
export const getAllNoteOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Build query
    const query: any = {};
    if (status) query.status = status;
    
    // Paginate results
    const result: PaginationResult<any> = await paginate(
      NoteOrder,
      query,
      { page: Number(page), limit: Number(limit) },
      { createdAt: -1 }
    );
    
    // Populate note and user details
    const populatedData = await NoteOrder.populate(result.data, [
      { path: 'noteId', select: 'title' },
      { path: 'userId', select: 'name email phone' }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: populatedData,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Update note order status (for admin panel)
export const updateNoteOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    
    const order = await NoteOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!order) {
      throw new AppError('Note order not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid note order ID'
      });
    } else if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalChapters, totalStudents, totalLessons, totalExams, activeAccesses] = await Promise.all([
      Course.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Lesson.countDocuments(),
      Exam.countDocuments({ isActive: true }),
      CourseAccess.countDocuments({ enabled: true })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalCourses: totalChapters,
        totalChapters,
        totalStudents,
        totalLessons,
        totalExams,
        activeAccesses,
        totalEmployees: await User.countDocuments({ role: { $in: ['teacher', 'admin', 'assistant'] } }),
        activeSubscriptions: activeAccesses,
        totalSales: 0,
        totalPayments: 0
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Get all submissions for an exam (for admin panel)
export const getExamSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { examId } = req.params;
    const { page, limit } = req.query;
    
    // Validate exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    
    // Build query
    const query: any = { 
      examId: examId,
      onModel: 'Exam'
    };
    
    // Paginate results
    const result: PaginationResult<any> = await paginate(
      Submission,
      query,
      { page: Number(page), limit: Number(limit) },
      { submittedAt: -1 }
    );
    
    // Populate user details
    const populatedData = await Submission.populate(result.data, {
      path: 'userId',
      select: 'name email phone'
    });
    
    res.status(200).json({
      status: 'success',
      data: populatedData,
      pagination: result.pagination
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid exam ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Get all submissions for an assignment (for admin panel)
export const getAssignmentSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const { page, limit } = req.query;
    
    // Validate assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }
    
    // Build query
    const query: any = { 
      examId: assignmentId,
      onModel: 'Assignment'
    };
    
    // Paginate results
    const result: PaginationResult<any> = await paginate(
      Submission,
      query,
      { page: Number(page), limit: Number(limit) },
      { submittedAt: -1 }
    );
    
    // Populate user details
    const populatedData = await Submission.populate(result.data, {
      path: 'userId',
      select: 'name email phone'
    });
    
    res.status(200).json({
      status: 'success',
      data: populatedData,
      pagination: result.pagination
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid assignment ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Create a lesson
export const createLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, title, description = '', duration = 0, order = 0, videoUrl = '', videoProvider, videoId } = req.body;
    const hasVideo = Boolean(String(videoUrl || '').trim() || (videoProvider && videoId));
    const video = hasVideo ? normalizeVideoSource(videoUrl, videoProvider, videoId) : null;
    const lesson = await Lesson.create({
      courseId, title, description, duration, order,
      ...(video ? {
        videoUrl: video.embedUrl,
        videoProvider: video.provider,
        videoId: video.videoId,
        bunnyVideoId: video.provider === 'bunny' ? video.videoId : undefined,
        videoStatus: video.provider === 'bunny' ? 'processing' : 'ready'
      } : {})
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        lesson
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else {
      res.status(error.statusCode || 500).json({
        status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Update a lesson
export const updateLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const current = await Lesson.findById(req.params.id);
    if (!current) throw new AppError('Lesson not found', 404);
    const payload: any = Object.fromEntries(['courseId', 'title', 'description', 'duration', 'order']
      .filter((field) => req.body[field] !== undefined)
      .map((field) => [field, req.body[field]]));
    if (req.body.videoUrl !== undefined || req.body.videoProvider !== undefined || req.body.videoId !== undefined) {
      const sourceWasProvided = req.body.videoUrl !== undefined;
      const provider = req.body.videoProvider || current.videoProvider;
      const videoId = req.body.videoId !== undefined ? req.body.videoId : (sourceWasProvided ? undefined : current.videoId);
      const source = sourceWasProvided ? String(req.body.videoUrl || '').trim() : String(current.videoUrl || '').trim();
      const hasVideo = Boolean(source || (provider && videoId));
      if (!hasVideo) {
        payload.videoUrl = '';
        payload.videoProvider = undefined;
        payload.videoId = undefined;
        payload.bunnyVideoId = undefined;
        payload.videoStatus = 'failed';
      } else {
        const video = normalizeVideoSource(source, provider, videoId);
        payload.videoUrl = video.embedUrl;
        payload.videoProvider = video.provider;
        payload.videoId = video.videoId;
        payload.bunnyVideoId = video.provider === 'bunny' ? video.videoId : undefined;
        payload.videoStatus = video.provider === 'bunny' ? 'processing' : 'ready';
      }
    }
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        lesson
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({
        status: 'fail',
        message: message
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid lesson ID'
      });
    } else {
      res.status(error.statusCode || 500).json({
        status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

export const createBunnyUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isBunnyConfigured()) throw new AppError('رفع Bunny غير مفعّل في إعدادات السيرفر.', 503);
    const title = String(req.body?.title || '').trim();
    if (!title) throw new AppError('عنوان الفيديو مطلوب.', 400);
    const upload = await createBunnyUploadSession(title);
    res.status(201).json({ status: 'success', data: { upload } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تجهيز رفع الفيديو إلى Bunny.'
    });
  }
};

export const completeBunnyUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const videoId = String(req.body?.videoId || '').trim();
    if (!videoId) throw new AppError('معرّف فيديو Bunny مطلوب.', 400);
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError('الدرس غير موجود.', 404);
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || 'library';
    lesson.videoProvider = 'bunny';
    lesson.videoId = videoId;
    lesson.bunnyVideoId = videoId;
    lesson.videoUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
    lesson.videoStatus = 'processing';
    await lesson.save();
    res.status(200).json({ status: 'success', data: { lesson } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر ربط فيديو Bunny بالدرس.'
    });
  }
};

// Delete a lesson
export const deleteLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    await LessonAccess.deleteMany({ lessonId: lesson._id });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid lesson ID'
      });
    } else {
      res.status(error.statusCode || 500).json({
        status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Update subscription status
export const updateSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['active', 'rejected'].includes(status)) {
      throw new AppError('Invalid status. Must be either "active" or "rejected"', 400);
    }

    // Find and update subscription
    const subscription = await Subscription.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId courseId');

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscription
      }
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid subscription ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Curriculum access is explicit and teacher-controlled. A chapter access record
// opens every lesson unless a lesson override says otherwise.
export const getStudentAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await User.findOne({ _id: req.params.userId, role: 'student' })
      .select('-password')
      .populate('educationalLevel', 'name nameAr level year order');
    if (!student) throw new AppError('الطالب غير موجود', 404);

    const studentLevelId = (student.educationalLevel as any)?._id || student.educationalLevel;
    const courses = await Course.find({ educationalLevel: studentLevelId })
      .sort({ term: 1, order: 1, createdAt: 1 })
      .lean();
    const courseIds = courses.map((course: any) => course._id);
    const lessons = await Lesson.find({ courseId: { $in: courseIds } })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    const [courseAccess, lessonAccess] = await Promise.all([
      CourseAccess.find({ userId: student._id, courseId: { $in: courseIds } }).lean(),
      LessonAccess.find({ userId: student._id, lessonId: { $in: lessons.map((lesson: any) => lesson._id) } }).lean()
    ]);
    const courseMap = new Map(courseAccess.map((access: any) => [String(access.courseId), access]));
    const lessonMap = new Map(lessonAccess.map((access: any) => [String(access.lessonId), access]));
    const lessonsByCourse = new Map<string, any[]>();
    lessons.forEach((lesson: any) => {
      const bucket = lessonsByCourse.get(String(lesson.courseId)) || [];
      const override = lessonMap.get(String(lesson._id));
      const chapterEnabled = Boolean(courseMap.get(String(lesson.courseId))?.enabled);
      bucket.push({
        id: String(lesson._id),
        title: lesson.title,
        order: lesson.order,
        duration: lesson.duration || 0,
        accessOverride: override ? override.enabled : null,
        accessEnabled: chapterEnabled && (override ? override.enabled : true)
      });
      lessonsByCourse.set(String(lesson.courseId), bucket);
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: student,
        courses: courses.map((course: any) => ({
          ...course,
          id: String(course._id),
          accessEnabled: Boolean(courseMap.get(String(course._id))?.enabled),
          lessons: lessonsByCourse.get(String(course._id)) || []
        }))
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تحميل صلاحيات الطالب'
    });
  }
};

export const getStudentOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await User.findOne({ _id: req.params.userId, role: 'student' })
      .select('-password')
      .populate('educationalLevel', 'name nameAr level year order')
      .lean();
    if (!student) throw new AppError('الطالب غير موجود', 404);

    const studentLevelId = (student.educationalLevel as any)?._id || student.educationalLevel;
    const courses = await Course.find({ educationalLevel: studentLevelId }).select('_id').lean();
    const courseIds = courses.map((course: any) => course._id);
    const [courseAccess, lessonAccess, lessons, examAttempts, videoLessons, videoTotals, latestAttempts] = await Promise.all([
      CourseAccess.find({ userId: student._id, courseId: { $in: courseIds }, enabled: true }).select('courseId').lean(),
      LessonAccess.find({ userId: student._id }).select('lessonId enabled').lean(),
      Lesson.find({ courseId: { $in: courseIds } }).select('_id courseId').lean(),
      Submission.countDocuments({ userId: student._id, onModel: 'Exam' }),
      VideoProgress.countDocuments({ userId: student._id }),
      VideoProgress.aggregate([
        { $match: { userId: student._id } },
        { $group: { _id: null, watchedSeconds: { $sum: '$watchedSeconds' }, completed: { $sum: { $cond: [{ $gte: ['$completionPercent', 95] }, 1, 0] } } } }
      ]),
      Submission.find({ userId: student._id, onModel: 'Exam' }).sort({ submittedAt: -1 }).limit(5).populate('examId', 'title').lean()
    ]);
    const openCourseIds = new Set(courseAccess.map((access: any) => String(access.courseId)));
    const lessonOverrides = new Map(lessonAccess.map((access: any) => [String(access.lessonId), access.enabled]));
    const openLessons = lessons.filter((lesson: any) => openCourseIds.has(String(lesson.courseId)) && lessonOverrides.get(String(lesson._id)) !== false).length;

    res.status(200).json({
      status: 'success',
      data: {
        user: student,
        stats: {
          openCourses: courseAccess.length,
          openLessons,
          examAttempts,
          videoLessons,
          watchedSeconds: videoTotals[0]?.watchedSeconds || 0,
          completedVideos: videoTotals[0]?.completed || 0
        },
        latestAttempts: latestAttempts.map((item: any) => ({
          ...item,
          percentage: item.totalMarks ? Math.round((item.score / item.totalMarks) * 100) : 0
        }))
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تحميل ملخص الطالب'
    });
  }
};

export const getStudentExamAttempts = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await User.exists({ _id: req.params.userId, role: 'student' });
    if (!student) throw new AppError('الطالب غير موجود', 404);
    const query: any = { userId: req.params.userId, onModel: 'Exam' };
    if (req.query.examId) query.examId = req.query.examId;
    const result: PaginationResult<any> = await paginate(
      Submission,
      query,
      { page: Number(req.query.page), limit: Number(req.query.limit) },
      { submittedAt: -1 }
    );
    const data = await Submission.populate(result.data, { path: 'examId', select: 'title type maxAttempts reviewMode' });
    res.status(200).json({
      status: 'success',
      data: data.map((item: any) => {
        const serialized = item.toObject ? item.toObject() : item;
        return {
          ...serialized,
          percentage: item.totalMarks ? Math.round((item.score / item.totalMarks) * 100) : 0,
          isPassed: item.totalMarks ? item.score / item.totalMarks >= 0.5 : false
        };
      }),
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تحميل محاولات الطالب'
    });
  }
};

export const getStudentVideoActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await User.exists({ _id: req.params.userId, role: 'student' });
    if (!student) throw new AppError('الطالب غير موجود', 404);
    const result: PaginationResult<any> = await paginate(
      VideoProgress,
      { userId: req.params.userId },
      { page: Number(req.query.page), limit: Number(req.query.limit) },
      { lastWatchedAt: -1 }
    );
    const data = await VideoProgress.populate(result.data, [
      { path: 'lessonId', select: 'title duration courseId', populate: { path: 'courseId', select: 'title term' } }
    ]);
    res.status(200).json({ status: 'success', data, pagination: result.pagination });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تحميل نشاط فيديو الطالب'
    });
  }
};

export const setStudentCourseAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const enabled = Boolean(req.body.enabled);
    const student = await User.findOne({ _id: req.params.userId, role: 'student' }).select('educationalLevel');
    const course = await Course.findById(req.params.courseId).select('educationalLevel');
    if (!student || !course) throw new AppError('الطالب أو الباب غير موجود', 404);
    if (String(student.educationalLevel) !== String(course.educationalLevel)) {
      throw new AppError('لا يمكن تفعيل باب خارج صف الطالب', 400);
    }

    const access = await CourseAccess.findOneAndUpdate(
      { userId: student._id, courseId: course._id },
      { $set: { enabled } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ status: 'success', data: { access } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تعديل صلاحية الباب'
    });
  }
};

export const setStudentLessonAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const enabled = Boolean(req.body.enabled);
    const student = await User.findOne({ _id: req.params.userId, role: 'student' }).select('educationalLevel');
    const lesson = await Lesson.findById(req.params.lessonId).select('courseId');
    const course = lesson ? await Course.findById(lesson.courseId).select('educationalLevel') : null;
    if (!student || !lesson || !course) throw new AppError('الطالب أو الدرس غير موجود', 404);
    if (String(student.educationalLevel) !== String(course.educationalLevel)) {
      throw new AppError('لا يمكن تعديل درس خارج صف الطالب', 400);
    }

    const access = await LessonAccess.findOneAndUpdate(
      { userId: student._id, lessonId: lesson._id },
      { $set: { enabled } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ status: 'success', data: { access } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'تعذر تعديل صلاحية الدرس'
    });
  }
};
