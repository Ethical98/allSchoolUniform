import express from 'express';
import { handleWebhook } from '../controllers/shippingWebhookController.js';

const router = express.Router();

// Webhook endpoint — NO JWT auth, uses webhook secret verification
router.post('/', handleWebhook);

export default router;
