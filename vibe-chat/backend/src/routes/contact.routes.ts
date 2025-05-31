import { Router } from 'express';
import {
  getContacts,
  sendContactRequest,
  getContactRequests,
  acceptContactRequest,
  rejectContactRequest,
  removeContact
} from '../controllers/contactsController';
import { protect } from '../middleware/auth';

const router = Router();

// Protect all contact routes
router.use(protect);

// Contact routes
router.get('/', getContacts);
router.delete('/:contactId', removeContact);

// Contact request routes
router.post('/requests', sendContactRequest);
router.get('/requests', getContactRequests);
router.patch('/requests/:requestId/accept', acceptContactRequest);
router.patch('/requests/:requestId/reject', rejectContactRequest);

export default router; 