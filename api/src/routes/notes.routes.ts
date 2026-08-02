import { Router } from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  createNoteOrder,
  getUserNoteOrders,
  getAllNoteOrders,
  updateNoteOrderStatus,
  getUserNotes
} from '../controllers/notesController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getNotes);
router.get('/user', protect, getUserNotes); // Add this new route
router.get('/:id', getNoteById);

// Protected routes (users)
router.use(protect);
router.post('/orders', createNoteOrder);
router.get('/orders/my', getUserNoteOrders);

// Admin routes
router.use(authorize('admin'));
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.get('/orders', getAllNoteOrders);
router.put('/orders/:id/status', updateNoteOrderStatus);

export default router;