import { Router } from 'express';
import { protect } from '../middleware/auth';
import { 
  getAssignments, 
  getAssignmentById, 
  getAssignmentQuestions, 
  submitAssignmentAnswers, 
  getAssignmentResults 
} from '../controllers/assignmentController';

const router = Router();

// Public routes
router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.get('/:id/questions', getAssignmentQuestions);

// Protected routes
router.use(protect);
router.post('/:id/submissions', submitAssignmentAnswers);
router.get('/:id/results', getAssignmentResults);

export default router;