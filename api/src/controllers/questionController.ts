import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import Question from '../models/Question';

// Get questions by exam ID
export async function getQuestionsByExamId(req: Request, res: Response): Promise<void> {
  try {
    const { examId, onModel } = req.query;
    
    if (!examId) {
      throw new AppError('Exam ID is required', 400);
    }
    
    // Build query
    const query: any = { examId: examId };
    
    // Add onModel filter if provided
    if (onModel && (onModel === 'Exam' || onModel === 'Assignment')) {
      query.onModel = onModel;
    } else {
      // Default to Exam for backward compatibility
      query.onModel = 'Exam';
    }
    
    // Get questions
    const questions = await Question.find(query).sort({ order: 1 });
    
    res.status(200).json({
      status: 'success',
      data: questions
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
}