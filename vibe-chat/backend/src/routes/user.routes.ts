import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';

const router = Router();

// Protect all user routes
router.use(protect);

// User routes
router.get('/search', (req: Request, res: Response) => {
  // This is a placeholder for user search functionality
  // Will be implemented in a separate controller
  res.status(200).json({
    status: 'success',
    message: 'User search endpoint'
  });
});

export default router; 