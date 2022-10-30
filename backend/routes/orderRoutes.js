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
  sendMail,
  updateOrderBillType,
  updateOrderToCanceled,
  updateOrderToConfirmed,
  updateOrderToDelivered,
  updateOrderToOutForDelivery,
  updateOrderTopaid,
  updateOrderToProcessing,
} from '../controllers/orderController.js';
import { isAdmin, protect } from '../Middleware/authMiddleware.js';
router.route('/send').get(sendMail);
router.route('/report').get(orderReport);
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
router.route('/:id/cancel').put(protect, isAdmin, updateOrderToCanceled);
router.route('/:id/billType').put(protect, isAdmin, updateOrderBillType);
router
  .route('/:id/incrementinvoicenumber')
  .put(protect, isAdmin, incrementInvoiceNumber);

export default router;
