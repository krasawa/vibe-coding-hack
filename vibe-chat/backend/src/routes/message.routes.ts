import { Router } from 'express';
import { sendMessage, addReaction } from '../controllers/chatController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Protect all message routes
router.use(protect);

// Message routes
router.post('/:chatId', upload.single('image'), sendMessage);
router.post('/:messageId/reactions', addReaction);

export default router; 