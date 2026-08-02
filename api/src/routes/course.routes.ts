import { Router } from 'express';
import { protect } from '../middleware/auth';
import { verifyVideoAccess } from '../middleware/videoAuth';
import { 
  getCourses, 
  getCourseById, 
  getCourseLessons,
  getLessonVideoUrl,
  recordVideoEvent
} from '../controllers/courseController';

const router = Router();

// Curriculum outlines and video access are both authenticated. Students only
// receive the chapters for their own grade; teachers/admins receive the full
// curriculum for management screens.
router.use(protect);
router.get('/', getCourses);
router.get('/:id', getCourseById);
router.get('/:id/lessons', getCourseLessons);
router.get('/:lessonId/video-url', getLessonVideoUrl);
router.post('/:lessonId/video-events', recordVideoEvent);

export default router;
