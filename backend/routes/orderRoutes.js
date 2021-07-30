import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  editOrderById,
  getMyOrders,
  getOrderById,
  getOrders,
  sendMail,
  updateOrderTopaid,
} from '../controllers/orderController.js';
import { isAdmin, protect } from '../Middleware/authMiddleware.js';
router.route('/send').get(sendMail);

router.route('/').post(protect, addOrderItems).get(protect, isAdmin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router
  .route('/:id')
  .get(protect, getOrderById)
  .put(protect, isAdmin, editOrderById);
router.route('/:id/pay').put(protect, updateOrderTopaid);

export default router;
