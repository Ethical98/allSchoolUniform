import express from 'express';
import { protect, isAdmin } from '../../../Middleware/authMiddleware.js';
import {
  createReturnRequest,
  createMyReturnRequest,
  getMyReturnsByOrder,
  getMyReturnById,
  cancelMyReturnRequest,
  getMyReturnEligibility,
  getReturnRequests,
  getReturnsDashboard,
  getReturnsByOrder,
  getReturnRequestById,
  updateReturnStatus,
  updateQCDisposition,
  generateCreditNote,
  createExchangeOrder,
  processRefund,
  addAdminNote,
  assignReturnCourier,
  trackReturnPickup,
  initiateReturnPickup,
  generateReturnLabel,
} from '../controllers/returnController.js';

const router = express.Router();

// Customer-facing routes (protect only, no admin required)
router.route('/my').post(protect, createMyReturnRequest);
router.route('/my/order/:orderId/eligibility').get(protect, getMyReturnEligibility);
router.route('/my/order/:orderId').get(protect, getMyReturnsByOrder);
router.route('/my/:id/cancel').patch(protect, cancelMyReturnRequest);
router.route('/my/:id').get(protect, getMyReturnById);

// All routes below require admin auth
router.use(protect, isAdmin);

// Dashboard & list
router.route('/').get(getReturnRequests).post(createReturnRequest);
router.route('/dashboard').get(getReturnsDashboard);
router.route('/order/:orderId').get(getReturnsByOrder);

// Single return operations
router.route('/:id').get(getReturnRequestById);
router.route('/:id/status').patch(updateReturnStatus);
router.route('/:id/qc').patch(updateQCDisposition);
router.route('/:id/credit-note').post(generateCreditNote);
router.route('/:id/exchange-order').post(createExchangeOrder);
router.route('/:id/refund').patch(processRefund);
router.route('/:id/notes').post(addAdminNote);

// Reverse shipping
router.route('/:id/assign-courier').post(assignReturnCourier);
router.route('/:id/track-pickup').get(trackReturnPickup);
router.route('/:id/initiate-pickup').post(initiateReturnPickup);
router.route('/:id/label').get(generateReturnLabel);

export default router;
