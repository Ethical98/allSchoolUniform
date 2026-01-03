import express from 'express';
const router = express.Router();
import {
  addToCart,
  cartItemRemove,
  getCart,
  mergeCart,
  resetCart,
  updateItemQuantity,
} from '../controllers/cartController.js';
import { protect } from '../Middleware/authMiddleware.js';

// ✅ Cart routes matching frontend API calls
router.route('/').post(protect, mergeCart);
router.route('/get').get(protect, getCart);
router.route('/add').post(protect, addToCart);
router.route('/remove').post(protect, cartItemRemove); // ✅ Changed to POST
router.route('/reset').post(protect, resetCart); // ✅ Changed to POST
router.route('/update').post(protect, updateItemQuantity); // ✅ New endpoint

export default router;

