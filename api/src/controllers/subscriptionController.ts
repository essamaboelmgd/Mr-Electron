import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import Subscription from '../models/Subscription';
import Course from '../models/Course';
import { paginate, PaginationResult } from '../utils/pagination';

// Get user subscriptions with pagination
export const getUserSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, status } = req.query;
    
    // Build query
    const query: any = { userId: req.user._id };
    if (status) query.status = status;
    
    // Paginate results
    const result: PaginationResult<any> = await paginate(
      Subscription,
      query,
      { page: Number(page), limit: Number(limit) },
      { subscribedAt: -1 }
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

// Get all subscriptions with pagination (for admin)
export const getAllSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, status } = req.query;
    
    // Build query
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    
    // Paginate results
    const result: PaginationResult<any> = await paginate(
      Subscription,
      query,
      { page: Number(page), limit: Number(limit) },
      { subscribedAt: -1 }
    );
    
    // Populate user and course details
    const populatedData = await Subscription.populate(result.data, [
      { path: 'userId', select: 'name email phone' },
      { path: 'courseId', select: 'title price', populate: { path: 'educationalLevel', select: 'nameAr' } }
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

// Subscribe to a course
export const subscribeToCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, paymentMethod, vodafoneReceipt } = req.body;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    
    // Check if user is already subscribed
    const existingSubscription = await Subscription.findOne({
      userId: req.user._id,
      courseId
    });
    
    if (existingSubscription) {
      throw new AppError('Already subscribed to this course', 400);
    }
    
    // Create subscription
    const subscription = await Subscription.create({
      userId: req.user._id,
      courseId,
      status: 'pending',
      paymentMethod,
      vodafoneReceipt,
      subscribedAt: new Date()
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        subscription
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

// Get subscription by ID
export const getSubscriptionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('courseId');
    
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