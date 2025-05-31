import { Router } from 'express';
import {
  getChats,
  getChat,
  createDirectChat,
  createGroupChat,
  getChatMessages
} from '../controllers/chatController';
import { protect } from '../middleware/auth';

const router = Router();

// Protect all chat routes
router.use(protect);

// Chat routes
router.get('/', getChats);
router.get('/:chatId', getChat);
router.post('/direct', createDirectChat);
router.post('/group', createGroupChat);
router.get('/:chatId/messages', getChatMessages);

export default router; 