import express from 'express';
import {
  createSchool,
  deleteSchool,
  getSchoolDetails,
  getSchoolNames,
  getSchools,
  updateSchool,
} from '../controllers/schoolController.js';

const router = express.Router();
import { protect, isAdmin } from '../Middleware/authMiddleware.js';

router
  .route('/')
  .get(protect, isAdmin, getSchools)
  .post(protect, isAdmin, createSchool);
router.route('/name/:keyword').get(getSchoolNames);
router
  .route('/:id')
  .get(protect, isAdmin, getSchoolDetails)
  .put(protect, isAdmin, updateSchool)
  .delete(protect, isAdmin, deleteSchool);

export default router;
