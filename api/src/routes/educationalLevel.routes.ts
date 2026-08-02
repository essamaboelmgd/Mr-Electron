import { Router } from 'express';
import { protect } from '../middleware/auth';
import { 
  getEducationalLevels, 
  getEducationalLevelById, 
  createEducationalLevel, 
  updateEducationalLevel, 
  deleteEducationalLevel 
} from '../controllers/educationalLevelController';

const router = Router();

// Public routes
router.get('/', getEducationalLevels);
router.get('/:id', getEducationalLevelById);

// Protected routes
router.use(protect);
router.post('/', createEducationalLevel);
router.put('/:id', updateEducationalLevel);
router.delete('/:id', deleteEducationalLevel);

export default router;