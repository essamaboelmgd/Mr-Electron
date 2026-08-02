import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import EducationalLevel from '../models/EducationalLevel';
import { paginate, PaginationResult } from '../utils/pagination';

// Get all educational levels with pagination
export const getEducationalLevels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, level, isActive } = req.query;
    
    // Build query
    const query: any = {};
    query.level = level && ['primary', 'prep'].includes(String(level))
      ? level
      : { $in: ['primary', 'prep'] };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // Paginate results
    const result: PaginationResult<any> = await paginate(
      EducationalLevel,
      query,
      { page: Number(page), limit: Number(limit) },
      { order: 1 }
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

// Get educational level by ID
export const getEducationalLevelById = async (req: Request, res: Response): Promise<void> => {
  try {
    const educationalLevel = await EducationalLevel.findById(req.params.id);
    
    if (!educationalLevel) {
      throw new AppError('Educational level not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        educationalLevel
      }
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid educational level ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Create educational level
export const createEducationalLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    const educationalLevel = await EducationalLevel.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        educationalLevel
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

// Update educational level
export const updateEducationalLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    const educationalLevel = await EducationalLevel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!educationalLevel) {
      throw new AppError('Educational level not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        educationalLevel
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
        message: 'Invalid educational level ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};

// Delete educational level
export const deleteEducationalLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    const educationalLevel = await EducationalLevel.findByIdAndDelete(req.params.id);
    
    if (!educationalLevel) {
      throw new AppError('Educational level not found', 404);
    }
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid educational level ID'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Server Error'
      });
    }
  }
};
