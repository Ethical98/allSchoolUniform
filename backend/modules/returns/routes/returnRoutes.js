import express from 'express';
import { protect, isAdmin } from '../../../Middleware/authMiddleware.js';
import {
  createReturnRequest,
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
} from '../controllers/returnController.js';

const router = express.Router();

// All routes require admin auth
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

export default router;
