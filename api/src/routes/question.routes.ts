import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getQuestionsByExamId } from '../controllers/questionController';

const router = Router();

// Public routes
router.get('/', getQuestionsByExamId);

export default router;