import express from 'express';
import { getSizes, getTypes } from '../controllers/typeController.js';

const router = express.Router();
import { protect, isAdmin } from '../Middleware/authMiddleware.js';

router.route('/').get(protect, isAdmin, getTypes);
router.route('/:type/sizes').get(protect, isAdmin, getSizes);

export default router;
