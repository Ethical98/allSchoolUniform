import express from 'express';

const router = express.Router();
import {
  getItemPrice,
  getProductById,
  getProducts,
} from '../controllers/productController.js';

router.route('/').get(getProducts);

router.route('/:id').get(getProductById);

router.route('/price/:id').get(getItemPrice);

export default router;
