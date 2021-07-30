import express from 'express';
import { getSchools } from '../controllers/schoolController.js';

const router = express.Router();
import { protect, isAdmin } from '../Middleware/authMiddleware.js';

router.route('/').get(protect, isAdmin, getSchools);
export default router;
