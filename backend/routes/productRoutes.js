import express from 'express';

const router = express.Router();
import {
  createProduct,
  deleteProduct,
  filterProducts,
  getItemPrice,
  getProductById,
  getProductByName,
  getProducts,
  updateProduct,
} from '../controllers/productController.js';
import { protect, isAdmin } from '../Middleware/authMiddleware.js';

router.route('/').get(getProducts).post(protect, isAdmin, createProduct);

router.route('/name/:name').get(getProductByName);
router.route('/filter').get(filterProducts).post(filterProducts);

router
  .route('/:id')
  .get(getProductById)
  .delete(protect, isAdmin, deleteProduct)
  .put(protect, isAdmin, updateProduct);

router.route('/price/:id').get(getItemPrice);

export default router;
