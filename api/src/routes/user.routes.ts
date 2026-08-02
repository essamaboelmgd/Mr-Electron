import { Router } from 'express';
import { protect } from '../middleware/auth';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword 
} from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(protect);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/change-password', changePassword);

export default router;