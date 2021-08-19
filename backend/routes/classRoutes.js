import express from 'express';
import {
  createClass,
  deleteClass,
  getClasses,
  updateClass,
} from '../controllers/classController.js';
import { isAdmin, protect } from '../Middleware/authMiddleware.js';
const router = express.Router();

router.route('/').get(getClasses).post(protect, isAdmin, createClass);
router.route('/:id').delete(deleteClass).put(protect, isAdmin, updateClass);
export default router;
