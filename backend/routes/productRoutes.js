import express from 'express';
import upload from '../Middleware/uploadMiddleware.js';

const router = express.Router();
import {
  createProduct,
  createProductReview,
  deleteProduct,
  filterProducts,
  getItemPrice,
  getProductById,
  getProductByName,
  getProductImages,
  getProducts,
  updateProduct,
  uploadProductImages,
} from '../controllers/productController.js';
import { protect, isAdmin } from '../Middleware/authMiddleware.js';

router
  .route('/images')
  .get(getProductImages)
  .post(upload.single('image'), uploadProductImages);
router.route('/').get(getProducts).post(protect, isAdmin, createProduct);
router.route('/:id/reviews').post(protect, createProductReview);
router.route('/name/:name').get(getProductByName);
router.route('/filter').get(filterProducts).post(filterProducts);

router
  .route('/:id')
  .get(getProductById)
  .delete(protect, isAdmin, deleteProduct)
  .put(protect, isAdmin, updateProduct);

router.route('/price/:id').get(getItemPrice);

export default router;
