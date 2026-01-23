import express from 'express';
import {
    submitSchoolRequest,
    submitProductRequest,
    getAllRequests,
    getRequestById,
    updateRequestStatus,
    deleteRequest,
} from '../controllers/notFoundRequestController.js';
import { protect, isAdmin, optionalAuth } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Public routes (optionalAuth to capture user if logged in)
router.post('/school', optionalAuth, submitSchoolRequest);
router.post('/product', optionalAuth, submitProductRequest);

// Admin routes
router.get('/', protect, isAdmin, getAllRequests);
router.get('/:id', protect, isAdmin, getRequestById);
router.put('/:id/status', protect, isAdmin, updateRequestStatus);
router.delete('/:id', protect, isAdmin, deleteRequest);

export default router;
