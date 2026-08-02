import { Router } from 'express';
import { protect } from '../middleware/auth';
import { requireAdmin } from '../controllers/adminController';
import { 
  getUserSubscriptions, 
  subscribeToCourse, 
  getSubscriptionById,
  getAllSubscriptions
} from '../controllers/subscriptionController';

const router = Router();

// All routes require authentication
router.use(protect);

router.get('/', getUserSubscriptions);
router.post('/', subscribeToCourse);
router.get('/:id', getSubscriptionById);

// Admin route for getting all subscriptions
router.get('/admin/all', requireAdmin, getAllSubscriptions);

export default router;