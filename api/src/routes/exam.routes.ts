import { Router } from 'express';
import { protect } from '../middleware/auth';
import { 
  getExams, 
  getExamById, 
  getExamQuestions, 
  submitExamAnswers, 
  getExamResults,
  getUserExams,
  startExamAttempt,
  saveExamAttempt,
  submitExamAttempt,
  getExamAttempts
} from '../controllers/examController';
import { downloadStudentExamReport } from '../controllers/reportController';

const router = Router();

router.use(protect);
router.get('/', getExams);
router.get('/user', getUserExams);
router.get('/:id', getExamById);
router.get('/:id/questions', getExamQuestions);
router.post('/:id/attempts', startExamAttempt);
router.get('/:id/attempts', getExamAttempts);
router.get('/:id/results.pdf', downloadStudentExamReport);
router.patch('/:id/attempts/:attemptId', saveExamAttempt);
router.post('/:id/attempts/:attemptId/submit', submitExamAttempt);
router.post('/:id/submissions', submitExamAnswers);
router.get('/:id/results', getExamResults);

export default router;
