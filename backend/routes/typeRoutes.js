import express from 'express';
import {
  createType,
  deleteType,
  getProductTypes,
  getSizes,
  getTypeDetails,
  getTypes,
  updateType,
} from '../controllers/typeController.js';

const router = express.Router();
import { protect, isAdmin } from '../Middleware/authMiddleware.js';

router
  .route('/')
  .get(protect, isAdmin, getTypes)
  .post(protect, isAdmin, createType);
router.route('/all').get(protect, isAdmin, getProductTypes);
router
  .route('/:id')
  .get(protect, isAdmin, getTypeDetails)
  .put(protect, isAdmin, updateType)
  .delete(protect, isAdmin, deleteType);
router.route('/:type/sizes').get(protect, isAdmin, getSizes);

export default router;
