import { Router } from 'express';
import { protect } from '../middleware/auth';
import { 
  getNotifications, 
  markNotificationAsRead, 
  getUnreadNotificationsCount 
} from '../controllers/notificationController';

const router = Router();

// All routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);
router.get('/unread-count', getUnreadNotificationsCount);

export default router;