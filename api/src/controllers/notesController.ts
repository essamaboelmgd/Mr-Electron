import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import Note from '../models/Note';
import NoteOrder from '../models/NoteOrder';
import { paginate, PaginationResult } from '../utils/pagination';

// Get all notes with pagination
export const getNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, educationalLevel, courseId, isActive } = req.query;
    
    // Build query
    const query: any = {};
    if (educationalLevel) query.educationalLevel = educationalLevel;
    if (courseId) query.courseId = courseId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // Paginate results and populate course information
    const result: PaginationResult<any> = await paginate(
      Note,
      query,
      { page: Number(page), limit: Number(limit) },
      { createdAt: -1 },
      { path: 'courseId', select: 'title' } // Populate course title
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

// Get notes for a user based on their educational level
export const getUserNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user exists
    if (!req.user) {
      throw new AppError('Unauthorized access', 401);
    }
    
    // Get user's educational level
    const userResponse = await fetch(`http://localhost:3000/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}`
      }
    });
    
    const userData: any = await userResponse.json();
    const userEducationalLevel = userData.data.user.educationalLevel._id;
    
    // Build query for notes
    const query: any = { 
      isActive: true,
      educationalLevel: userEducationalLevel
    };
    
    // Paginate results and populate course information
    const result: PaginationResult<any> = await paginate(
      Note,
      query,
      { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 10 },
      { createdAt: -1 },
      { path: 'courseId', select: 'title' } // Populate course title
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

// Get note by ID
export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await Note.findById(req.params.id).populate('courseId', 'title');
    
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

// Create a new note (admin only)
export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
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

// Update a note (admin only)
export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
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
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid note ID'
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

// Delete a note (admin only)
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    
    if (!note) {
      throw new AppError('Note not found', 404);
    }
    
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

// Create a note order
export const createNoteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderData = {
      ...req.body,
      userId: req.user._id // Get user ID from authenticated user
    };
    
    const order = await NoteOrder.create(orderData);
    
    res.status(201).json({
      status: 'success',
      data: {
        order
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

// Get user's note orders
export const getUserNoteOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const userId = req.user._id; // Get user ID from authenticated user
    
    // Paginate results
    const result: PaginationResult<any> = await paginate(
      NoteOrder,
      { userId },
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

// Get all note orders (admin only)
export const getAllNoteOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, status } = req.query;
    
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

// Update note order status (admin only)
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