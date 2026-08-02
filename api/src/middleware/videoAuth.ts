import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import jwt from 'jsonwebtoken';
import Lesson from '../models/Lesson';
import VideoAccessLog from '../models/VideoAccessLog';

// Middleware to verify video access token
export const verifyVideoAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const { token } = req.query;
    
    // Check if user is authenticated
    if (!req.user) {
      throw new AppError('Unauthorized access', 401);
    }
    
    // Check if token is provided
    if (!token || typeof token !== 'string') {
      throw new AppError('Access denied. Invalid token.', 403);
    }
    
    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    } catch (error) {
      throw new AppError('Access denied. Invalid token.', 403);
    }
    
    // Check if token is expired
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new AppError('Access denied. Token expired.', 403);
    }
    
    // Check if token matches the user and lesson
    if (decoded.userId !== req.user._id || decoded.lessonId !== lessonId) {
      throw new AppError('Access denied. Invalid token.', 403);
    }
    
    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }
    
    // Log the video access
    await VideoAccessLog.create({
      userId: req.user._id,
      lessonId: lessonId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      expiresAt: new Date(decoded.exp * 1000)
    });
    
    // Token is valid, proceed to next middleware
    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Server Error', 500));
    }
  }
};