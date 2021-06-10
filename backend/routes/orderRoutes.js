import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  getOrderById,
  updateOrderTopaid,
} from '../controllers/orderController.js';
import { protect } from '../Middleware/authMiddleware.js';

router.route('/').post(protect, addOrderItems);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderTopaid);

export default router;
