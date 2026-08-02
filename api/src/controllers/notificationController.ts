import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import Notification from '../models/Notification';
import { paginate, PaginationResult } from '../utils/pagination';

// Get user notifications with pagination
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, type, read } = req.query;
    
    // Build query
    const query: any = { userId: req.user._id };
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';
    
    // Paginate results
    const result: PaginationResult<any> = await paginate(
      Notification,
      query,
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

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid notification ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        count
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};