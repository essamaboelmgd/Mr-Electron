import { Router } from 'express';
import { protect } from '../middleware/auth';
import { requireAdmin } from '../controllers/adminController';
import { uploadNoteImage, uploadQuestionImage } from '../middleware/upload';
import { 
  createCourse, 
  updateCourse, 
  deleteCourse,
  createExam,
  updateExam,
  deleteExam,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getAllUsers,
  getDashboardStats,
  createLesson,
  updateLesson,
  deleteLesson,
  createBunnyUpload,
  completeBunnyUpload,
  updateSubscriptionStatus,
  getAllExams,
  getAllAssignments,
  getExamSubmissions,
  getAssignmentSubmissions,
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  getAllNoteOrders,
  updateNoteOrderStatus,
  getStudentAccess,
  getStudentOverview,
  getStudentExamAttempts,
  getStudentVideoActivity,
  setStudentCourseAccess,
  setStudentLessonAccess
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication and admin role
router.use(protect, requireAdmin);

// Course management
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Lesson management
router.post('/lessons', createLesson);
router.put('/lessons/:id', updateLesson);
router.delete('/lessons/:id', deleteLesson);
router.post('/videos/bunny/upload-session', createBunnyUpload);
router.post('/lessons/:lessonId/bunny-upload/complete', completeBunnyUpload);

// Exam management
router.get('/exams', getAllExams);
router.get('/exams/:examId/submissions', getExamSubmissions);
router.post('/exams', createExam);
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);

// Assignment management
router.get('/assignments', getAllAssignments);
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);

// Note management
router.get('/notes', getAllNotes);
router.post('/notes', uploadNoteImage.single('image'), createNote);
router.put('/notes/:id', uploadNoteImage.single('image'), updateNote);
router.delete('/notes/:id', deleteNote);

// Note order management
router.get('/notes/orders', getAllNoteOrders);
router.put('/notes/orders/:id/status', updateNoteOrderStatus);

// Question management
router.post('/questions', uploadQuestionImage.single('image'), createQuestion);
router.put('/questions/:id', uploadQuestionImage.single('image'), updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId/overview', getStudentOverview);
router.get('/users/:userId/exam-attempts', getStudentExamAttempts);
router.get('/users/:userId/video-activity', getStudentVideoActivity);
router.get('/users/:userId/access', getStudentAccess);
router.put('/users/:userId/courses/:courseId/access', setStudentCourseAccess);
router.put('/users/:userId/lessons/:lessonId/access', setStudentLessonAccess);

// Subscription management
router.put('/subscriptions/:id/status', updateSubscriptionStatus);

// Dashboard statistics
router.get('/stats', getDashboardStats);

export default router;
