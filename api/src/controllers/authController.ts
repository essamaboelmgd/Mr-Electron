import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import EducationalLevel from '../models/EducationalLevel'; // Added import
import { AppError } from '../middleware/errorHandler';

// Generate JWT token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mr_electron_dev_secret_change_me', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  } as jwt.SignOptions);
};

// Register user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, educationalLevel, password } = req.body;

    if (!name || !phone || !educationalLevel || !password) {
      res.status(400).json({
        status: 'fail',
        message: 'الاسم ورقم الهاتف والصف الدراسي وكلمة المرور مطلوبة'
      });
      return;
    }

    const level = await EducationalLevel.findOne({ _id: educationalLevel, isActive: true });
    if (!level) {
      res.status(400).json({
        status: 'fail',
        message: 'الصف الدراسي غير صحيح'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      res.status(400).json({
        status: 'fail',
        message: 'Phone number already registered'
      });
      return;
    }

    // Create user
    const user = await User.create({
      name,
      phone,
      educationalLevel,
      password,
      role: 'student'
    });

    // Populate educational level
    await user.populate('educationalLevel');

    // Generate token
    const token = generateToken(user._id.toString());

    // Send response
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          educationalLevel: user.educationalLevel,
          role: user.role
        }
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

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;

    // Check for phone and password
    if (!phone || !password) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide phone and password'
      });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ phone }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        status: 'fail',
        message: 'Incorrect phone or password'
      });
      return;
    }

    // Populate educational level
    await user.populate('educationalLevel');

    // Generate token
    const token = generateToken(user._id.toString());

    // Send response
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          educationalLevel: user.educationalLevel,
          role: user.role
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Populate educational level for current user
    const userWithLevel = await User.findById(req.user._id).populate('educationalLevel');
    
    res.status(200).json({
      status: 'success',
      data: {
        user: userWithLevel
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server Error'
    });
  }
};
