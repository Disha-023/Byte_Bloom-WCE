import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  submitComplaint,
  getComplaints,
  getComplaintById
} from '../controllers/complaintController.js';

const router = Router();

// POST /api/complaints - Submit a citizen complaint with optional image upload
router.post('/', upload.single('image'), submitComplaint);

// GET /api/complaints - Fetch all complaints ordered newest first
router.get('/', getComplaints);

// GET /api/complaints/:complaintId - Fetch single complaint by business ID
router.get('/:complaintId', getComplaintById);

export default router;
