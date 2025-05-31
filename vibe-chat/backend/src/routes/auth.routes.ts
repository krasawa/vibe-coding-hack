import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getCurrentUser);

export default router; 