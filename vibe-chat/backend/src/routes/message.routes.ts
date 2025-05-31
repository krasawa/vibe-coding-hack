import { Router } from 'express';
import multer from 'multer';
import {
  sendMessage,
  addReaction,
} from '../controllers/chatController';
import { protect } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

// Protect all message routes
router.use(protect);

// Message routes
router.post('/:chatId', upload.single('image'), sendMessage);
router.post('/:messageId/reactions', addReaction);

export default router; 