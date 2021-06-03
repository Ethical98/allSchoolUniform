import express from 'express';
const router = express.Router();
import {
  addToCart,
  cartItemRemove,
  getCart,
  mergeCart,
} from '../controllers/cartController.js';
import { protect } from '../Middleware/authMiddleware.js';

router.route('/').post(protect, mergeCart);
router.route('/get').get(protect, getCart);
router.route('/add').post(protect, addToCart);
router.route('/remove').post(protect, cartItemRemove);

export default router;
