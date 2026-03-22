import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  editOrderById,
  getMyOrders,
  getOrderById,
  getOrderByOrderId,
  getOrders,
  incrementInvoiceNumber,
  orderReport,
  updateOrderBillType,
  updateOrderToCanceled,
  updateOrderToConfirmed,
  updateOrderToDelivered,
  updateOrderToOutForDelivery,
  updateOrderToPaid,
  updateOrderToProcessing,
  addOrderComment,
  deleteOrderComment,
} from '../controllers/orderController.js';
import { getDashboardData } from '../controllers/dashboardController.js';
import { isAdmin, protect } from '../Middleware/authMiddleware.js';
router.route('/report').get(orderReport);
router.route('/dashboard').get(protect, isAdmin, getDashboardData);
router.route('/').post(protect, addOrderItems).get(protect, isAdmin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router
  .route('/:id')
  .get(protect, getOrderById)
  .put(protect, isAdmin, editOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/orderid/:id').get(protect, getOrderByOrderId);
router.route('/:id/deliver').put(protect, isAdmin, updateOrderToDelivered);
router.route('/:id/confirm').put(protect, isAdmin, updateOrderToConfirmed);
router.route('/:id/processing').put(protect, isAdmin, updateOrderToProcessing);
router
  .route('/:id/outfordelivery')
  .put(protect, isAdmin, updateOrderToOutForDelivery);
router.route('/:id/cancel').put(protect, isAdmin, updateOrderToCanceled);
router.route('/:id/billType').put(protect, isAdmin, updateOrderBillType);
router
  .route('/:id/incrementinvoicenumber')
  .put(protect, isAdmin, incrementInvoiceNumber);
router.route('/:id/comments').post(protect, isAdmin, addOrderComment);
router
  .route('/:id/comments/:commentId')
  .delete(protect, isAdmin, deleteOrderComment);

export default router;
