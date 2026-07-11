import Order from '../../../models/OrderModel.js';
import ShippingLog from '../models/ShippingLogModel.js';
import ReturnRequest from '../../returns/models/ReturnRequestModel.js';
import { validateTransition } from '../../returns/utils/returnStateMachine.js';
import { restoreStockOnRTO } from '../utils/reconcileShipping.js';
import {
  sendOrderShippedEmail,
  sendOutForDeliveryEmail,
  sendOrderDeliveredEmail,
} from '../../../utils/emailService.js';
import {
  sendNDRAlertEmail,
  sendRTOAlertEmail,
  sendWeightDisputeEmail,
} from '../utils/shippingEmails.js';
import { applyShipmentStatus } from '../utils/shipmentStatus.js';
import dotenv from 'dotenv';

dotenv.config();

// Map ShipRocket reverse shipment status codes to return status transitions
const REVERSE_STATUS_MAP = {
  3:  { reverseStatus: 'PICKUP_SCHEDULED' },
  6:  { reverseStatus: 'IN_TRANSIT', returnStatus: 'IN_TRANSIT' },
  9:  { reverseStatus: 'IN_TRANSIT' },    // in-transit scan: updates reverseShipping.status only
  7:  { reverseStatus: 'RECEIVED', returnStatus: 'RECEIVED' },
  14: { reverseStatus: 'PICKUP_FAILED', returnStatus: 'PICKUP_FAILED' },
  16: { reverseStatus: 'CANCELLED', returnStatus: 'CANCELLED' }, // cancelled by ShipRocket/courier
  17: { reverseStatus: 'CANCELLED', returnStatus: 'CANCELLED' }, // RTO/cancelled variant
};

const handleReverseWebhook = async (awb, statusCode) => {
  if (!awb) return false;

  // Exclude terminal and post-receipt states — idempotency guard:
  // if the return is already RECEIVED or further along, duplicate webhooks are silently ignored.
  const returnRequest = await ReturnRequest.findOne({
    'reverseShipping.awbCode': awb,
    status: { $nin: ['COMPLETED', 'CANCELLED', 'REJECTED', 'RECEIVED', 'QC_IN_PROGRESS', 'QC_COMPLETED'] },
  });

  if (!returnRequest) return false;

  const mapping = REVERSE_STATUS_MAP[statusCode];
  if (!mapping) return false;

  returnRequest.reverseShipping.status = mapping.reverseStatus;
  returnRequest.reverseShipping.syncedAt = new Date();

  if (mapping.returnStatus) {
    try {
      validateTransition(returnRequest.status, mapping.returnStatus, returnRequest.type);
      const previousStatus = returnRequest.status;
      returnRequest.status = mapping.returnStatus;
      returnRequest.timeline.push({
        action: 'STATUS_CHANGE',
        fromStatus: previousStatus,
        toStatus: mapping.returnStatus,
        note: `Auto-updated via ShipRocket webhook (status code: ${statusCode})`,
        performedByName: 'System (Webhook)',
      });

      if (mapping.returnStatus === 'RECEIVED') {
        returnRequest.reverseShipping.receivedAt = new Date();
      }
    } catch (e) {
      console.warn(`[ReturnWebhook] Skipping invalid transition for ${returnRequest.returnId}: ${e.message}`);
    }
  }

  await returnRequest.save();
  return true;
};

/**
 * Handle incoming webhook from shipping provider.
 * POST /api/shipping/webhook
 * No JWT auth — verified via webhook secret.
 */
export const handleWebhook = async (req, res) => {
  // Always return 200 to prevent provider retries
  try {
    // Verify webhook secret
    const webhookSecret = req.headers['x-api-key'] || req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.SHIPPING_WEBHOOK_SECRET) {
      console.error('[Webhook] Invalid webhook secret');
      // Still return 200 to avoid retries, but log the failure
      await ShippingLog.create({
        action: 'WEBHOOK',
        requestPayload: req.body,
        success: false,
        errorMessage: 'Invalid webhook secret',
        source: 'webhook',
      });
      return res.status(200).json({ status: 'rejected' });
    }

    const payload = req.body;

    // Log the webhook
    await ShippingLog.create({
      action: 'WEBHOOK',
      requestPayload: payload,
      success: true,
      source: 'webhook',
    });

    // Resolve the forward order first (forward-wins routing): a forward AWB must
    // never be swallowed as a return. Returns are handled only when NO forward
    // order owns this AWB/order id.
    const awb = payload.awb || payload.awb_code;
    const srOrderId = payload.order_id;

    let order;
    if (awb) {
      order = await Order.findOne({ 'shipping.awbCode': awb });
    }
    if (!order && srOrderId) {
      order = await Order.findOne({ 'shipping.providerOrderId': srOrderId });
    }

    if (!order) {
      // No forward order owns this AWB — try reverse (returns) handling.
      const webhookStatusCode = Number(payload.current_status_id || payload.status_id || 0);
      const handledAsReturn = await handleReverseWebhook(awb || '', webhookStatusCode);
      if (handledAsReturn) {
        return res.status(200).json({ received: true, type: 'reverse' });
      }
      console.error('[Webhook] Order not found for AWB:', awb, 'Order ID:', srOrderId);
      return res.status(200).json({ status: 'order_not_found' });
    }

    const statusCode = Number(payload.current_status_id || payload.status_code);
    const statusText = payload.current_status || payload.status;

    const { changed, sideEffects } = applyShipmentStatus(order, {
      code: statusCode,
      text: statusText,
      location: payload.current_location || payload.location || '',
      remarks: payload.scans?.[0]?.activity || statusText,
      edd: payload.etd || payload.edd,
      chargedWeight: payload.charged_weight || payload.weight,
      scanDate: payload.scans?.[0]?.date,
    });

    if (!changed) {
      return res.status(200).json({ status: 'already_processed' });
    }

    // Fire side-effects (emails + RTO stock restore). Errors are swallowed so the
    // webhook always returns 200.
    const user = await import('../../../models/UserModel.js').then((m) => m.default.findById(order.user));
    for (const fx of sideEffects) {
      try {
        if (fx.type === 'restoreStockOnRTO') {
          await restoreStockOnRTO(order);
        } else if (fx.type === 'email' && user) {
          if (fx.kind === 'shipped') sendOrderShippedEmail(order, user, { awb: order.shipping.awbCode, courier: order.shipping.courierName }).catch((e) => console.error('[Webhook] Shipped email failed:', e.message));
          else if (fx.kind === 'ofd') sendOutForDeliveryEmail(order, user, { awb: order.shipping.awbCode, courier: order.shipping.courierName }).catch((e) => console.error('[Webhook] OFD email failed:', e.message));
          else if (fx.kind === 'delivered') sendOrderDeliveredEmail(order, user).catch((e) => console.error('[Webhook] Delivered email failed:', e.message));
        }
        if (fx.type === 'email' && fx.kind === 'ndr') sendNDRAlertEmail(order, fx.reason).catch((e) => console.error('[Webhook] NDR email failed:', e.message));
        else if (fx.type === 'email' && fx.kind === 'rto') sendRTOAlertEmail(order).catch((e) => console.error('[Webhook] RTO email failed:', e.message));
        else if (fx.type === 'email' && fx.kind === 'weight') sendWeightDisputeEmail(order, fx.chargedWeight).catch((e) => console.error('[Webhook] Weight dispute email failed:', e.message));
      } catch (e) {
        console.error('[Webhook] Side-effect failed:', e.message);
      }
    }

    await order.save();

    res.status(200).json({ status: 'processed' });
  } catch (error) {
    console.error('[Webhook] Processing error:', error.message);
    // Still return 200 to prevent retries
    res.status(200).json({ status: 'error', message: error.message });
  }
};
