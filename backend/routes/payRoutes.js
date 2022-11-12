import express from 'express';
const router = express.Router();
import {
  orderPayment,
  orderPaymentVerify,
} from '../controllers/payController.js';
import { protect } from '../Middleware/authMiddleware.js';

router.route('/payment').post(protect, orderPayment);
router.route('/payment/verify').post(protect, orderPaymentVerify);

export default router;
