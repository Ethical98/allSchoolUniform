import express from 'express';
const router = express.Router();
import {
  payUMoneyPayment,
  payUMoneyPaymentResponse,
} from '../controllers/payController.js';
import { protect } from '../Middleware/authMiddleware.js';

router.route('/payment/payumoney').post(protect, payUMoneyPayment);
router
  .route('/payment/payumoney/response')
  .post(protect, payUMoneyPaymentResponse);

export default router;
