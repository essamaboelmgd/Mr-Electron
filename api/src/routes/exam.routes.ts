import { Router } from 'express';
import { protect } from '../middleware/auth';
import { 
  getExams, 
  getExamById, 
  getExamQuestions, 
  submitExamAnswers, 
  getExamResults,
  getUserExams
} from '../controllers/examController';

const router = Router();

router.use(protect);
router.get('/', getExams);
router.get('/user', getUserExams);
router.get('/:id', getExamById);
router.get('/:id/questions', getExamQuestions);
router.post('/:id/submissions', submitExamAnswers);
router.get('/:id/results', getExamResults);

export default router;
