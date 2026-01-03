import express from 'express';
import {
    createPaymentOrder,
    verifyPayment,
    getWebhookStatus,
    handlePaymentFailure,
    refundPayment,
    handlePaymentWebhook,
} from '../controllers/payController.js';
import { protect } from '../Middleware/authMiddleware.js';

const router = express.Router();

// ✅ Protected routes (require authentication)
router.post('/createOrder', protect, createPaymentOrder);
router.post('/verifyPayment', protect, verifyPayment);
router.get('/webhook/status', protect, getWebhookStatus); // ✅ NEW: Webhook polling
router.post('/paymentFailed', protect, handlePaymentFailure);
router.post('/refund', protect, refundPayment);

// ✅ Public webhook (but signature verified internally)
router.post('/webhook', handlePaymentWebhook);

export default router;

