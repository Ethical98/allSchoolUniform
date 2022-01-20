import express from 'express';
import {
  createSchool,
  deleteSchool,
  getSchoolDetails,
  getSchoolImages,
  getSchoolNames,
  getSchools,
  updateSchool,
  uploadSchoolImages,
} from '../controllers/schoolController.js';
import { protect, isAdmin } from '../Middleware/authMiddleware.js';
import upload from '../Middleware/uploadMiddleware.js';

const router = express.Router();

router
  .route('/images')
  .get(getSchoolImages)
  .post(upload.single('image'), uploadSchoolImages);
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
