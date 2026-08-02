import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import Assignment from '../models/Assignment';
import Question from '../models/Question';
import Submission from '../models/Submission';
import { paginate, PaginationResult } from '../utils/pagination';

// Get all assignments with pagination
export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, courseId, lessonId, type, isActive } = req.query;
    
    // Build query
    const query: any = {};
    if (courseId) query.courseId = courseId;
    if (lessonId) query.lessonId = lessonId;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // Paginate results
    const result: PaginationResult<any> = await paginate(
      Assignment,
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
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Get assignment by ID
export const getAssignmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
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

// Get questions for an assignment
export const getAssignmentQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if assignment exists
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }
    
    // Get questions
    const questions = await Question.find({ 
      examId: req.params.id,
      onModel: 'Assignment'
    }).sort({ order: 1 });
    
    res.status(200).json({
      status: 'success',
      data: {
        questions
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Submit assignment answers
export const submitAssignmentAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { answers } = req.body;
    
    // Check if assignment exists
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }
    
    // Check if user has already submitted this assignment
    const existingSubmission = await Submission.findOne({
      userId: req.user._id,
      examId: req.params.id,
      onModel: 'Assignment'
    });
    
    // If there's an existing submission, check if the student passed
    if (existingSubmission) {
      // Calculate if the student passed (50% or higher)
      const percentage = (existingSubmission.score / existingSubmission.totalMarks) * 100;
      const isPassed = percentage >= 50;
      
      // If student passed, don't allow retake
      if (isPassed) {
        throw new AppError('You have already passed this assignment', 400);
      }
      // If student failed, we allow retake by continuing with the submission
    }
    
    // Get questions for this assignment
    const questions = await Question.find({ 
      examId: req.params.id,
      onModel: 'Assignment'
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
      // Calculate if the student passed this attempt (50% or higher)
      const percentage = (score / totalMarks) * 100;
      const isPassed = percentage >= 50;
      
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
        onModel: 'Assignment',
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
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Get assignment results
export const getAssignmentResults = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if assignment exists
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }
    
    // Get submission
    const submission = await Submission.findOne({
      userId: req.user._id,
      examId: req.params.id,
      onModel: 'Assignment'
    });
    
    if (!submission) {
      throw new AppError('No submission found for this assignment', 404);
    }
    
    // Calculate if the student passed (50% or higher)
    const percentage = (submission.score / submission.totalMarks) * 100;
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
