import express from 'express';
import {
  createType,
  deleteType,
  getProductTypes,
  getSizeGuideImages,
  getSizes,
  getTypeDetails,
  getTypeImages,
  getTypes,
  updateType,
  uploadSizeGuideImages,
  getCategories,
} from '../controllers/typeController.js';
import { protect, isAdmin } from '../Middleware/authMiddleware.js';
import upload from '../Middleware/uploadMiddleware.js';

const router = express.Router();

router
  .route('/images')
  .get(getSizeGuideImages)
  .post(upload.single('image'), uploadSizeGuideImages);
router
  .route('/')
  .get(protect, isAdmin, getTypes)
  .post(protect, isAdmin, createType);
router.route('/all').get(protect, isAdmin, getProductTypes);
router.route('/categories').get(getCategories);
router
  .route('/:id')
  .get(protect, isAdmin, getTypeDetails)
  .put(protect, isAdmin, updateType)
  .delete(protect, isAdmin, deleteType);
router.route('/:type/images').get(getTypeImages);
router.route('/:type/sizes').get(protect, isAdmin, getSizes);

export default router;
