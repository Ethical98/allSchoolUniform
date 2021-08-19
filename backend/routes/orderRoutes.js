import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  editOrderById,
  getMyOrders,
  getOrderById,
  getOrderByOrderId,
  getOrders,
  sendMail,
  updateOrderToConfirmed,
  updateOrderToDelivered,
  updateOrderToOutForDelivery,
  updateOrderTopaid,
  updateOrderToProcessing,
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
router.route('/orderid/:id').get(getOrderByOrderId);
router.route('/:id/deliver').put(protect, isAdmin, updateOrderToDelivered);
router.route('/:id/confirm').put(protect, isAdmin, updateOrderToConfirmed);
router.route('/:id/processing').put(protect, isAdmin, updateOrderToProcessing);
router
  .route('/:id/outfordelivery')
  .put(protect, isAdmin, updateOrderToOutForDelivery);

export default router;
