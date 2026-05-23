import Order from '../../../models/OrderModel.js';
import ShippingLog from '../models/ShippingLogModel.js';
import ReturnRequest from '../../returns/models/ReturnRequestModel.js';
import { validateTransition } from '../../returns/utils/returnStateMachine.js';
import StockMovement from '../../stock/models/StockMovementModel.js';
import Product from '../../../models/ProductModel.js';
import handleStockAlerts from '../../stock/utils/stockAlertHelper.js';
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
import dotenv from 'dotenv';

dotenv.config();

// Status code priority for idempotency (higher = further in lifecycle)
const STATUS_PRIORITY = {
  6: 10,   // Shipped
  18: 15,  // Pickup Scheduled
  17: 20,  // Out for Delivery
  7: 30,   // Delivered
  9: 25,   // NDR / Undelivered
  14: 35,  // RTO Initiated
  15: 40,  // RTO Delivered
  21: 0,   // Weight Discrepancy (can happen anytime)
};

// Map ShipRocket reverse shipment status codes to return status transitions
const REVERSE_STATUS_MAP = {
  3:  { reverseStatus: 'PICKUP_SCHEDULED' },
  6:  { reverseStatus: 'IN_TRANSIT', returnStatus: 'IN_TRANSIT' },
  9:  { reverseStatus: 'IN_TRANSIT' },
  7:  { reverseStatus: 'RECEIVED', returnStatus: 'RECEIVED' },
  14: { reverseStatus: 'PICKUP_FAILED', returnStatus: 'PICKUP_FAILED' },
};

const handleReverseWebhook = async (awb, statusCode) => {
  if (!awb) return false;

  const returnRequest = await ReturnRequest.findOne({
    'reverseShipping.awbCode': awb,
    status: { $nin: ['COMPLETED', 'CANCELLED', 'REJECTED', 'RECEIVED', 'QC_IN_PROGRESS', 'QC_COMPLETED'] },
  });

  if (!returnRequest) return false;

  const mapping = REVERSE_STATUS_MAP[statusCode];
  if (!mapping) return false;

  returnRequest.reverseShipping = {
    ...returnRequest.reverseShipping?.toObject?.() || {},
    status: mapping.reverseStatus,
    syncedAt: new Date(),
  };

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

    // Check if this is a reverse shipment webhook first
    const webhookAwb = req.body?.awb || req.body?.awb_code || '';
    const webhookStatusCode = Number(req.body?.current_status_id || req.body?.status_id || 0);

    const handledAsReturn = await handleReverseWebhook(webhookAwb, webhookStatusCode);
    if (handledAsReturn) {
      return res.status(200).json({ received: true, type: 'reverse' });
    }

    // Find the order by AWB or provider order ID
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
      console.error('[Webhook] Order not found for AWB:', awb, 'Order ID:', srOrderId);
      return res.status(200).json({ status: 'order_not_found' });
    }

    const statusCode = Number(payload.current_status_id || payload.status_code);
    const statusText = payload.current_status || payload.status;

    // Idempotency check: skip if same or lower priority status
    const currentPriority = STATUS_PRIORITY[order.shipping?.statusCode] || 0;
    const newPriority = STATUS_PRIORITY[statusCode] || 0;
    if (statusCode !== 21 && newPriority <= currentPriority && order.shipping?.statusCode === statusCode) {
      return res.status(200).json({ status: 'already_processed' });
    }

    // Update shipping status
    order.shipping.status = statusText;
    order.shipping.statusCode = statusCode;
    order.shipping.syncedAt = new Date();

    // Update EDD if provided
    if (payload.etd || payload.edd) {
      order.shipping.estimatedDeliveryDate = new Date(payload.etd || payload.edd);
    }

    // Add to tracking history
    order.shipping.trackingHistory.push({
      status: statusText,
      statusCode,
      location: payload.current_location || payload.location || '',
      timestamp: new Date(payload.scans?.[0]?.date || Date.now()),
      remarks: payload.scans?.[0]?.activity || statusText,
    });

    // Get user for email
    const user = await import('../../../models/UserModel.js').then(m => m.default.findById(order.user));

    // Handle specific statuses
    switch (statusCode) {
      case 6: // Shipped
        order.tracking.isProcessing = true;
        order.tracking.processedAt = order.tracking.processedAt || new Date();
        order.orderStatus = 'Processing';
        if (user) {
          sendOrderShippedEmail(order, user, {
            awb: order.shipping.awbCode,
            courier: order.shipping.courierName,
          }).catch((e) => console.error('[Webhook] Shipped email failed:', e.message));
        }
        break;

      case 17: // Out for Delivery
        order.tracking.isOutForDelivery = true;
        order.tracking.outForDeliveryAt = new Date();
        order.orderStatus = 'Out For Delivery';
        if (user) {
          sendOutForDeliveryEmail(order, user, {
            awb: order.shipping.awbCode,
            courier: order.shipping.courierName,
          }).catch((e) => console.error('[Webhook] OFD email failed:', e.message));
        }
        break;

      case 7: // Delivered
        order.tracking.isDelivered = true;
        order.tracking.deliveredAt = new Date();
        order.orderStatus = 'Delivered';
        // Clear NDR if was in NDR
        if (order.shipping.ndr?.isNDR) {
          order.shipping.ndr.isNDR = false;
        }
        if (user) {
          sendOrderDeliveredEmail(order, user).catch((e) =>
            console.error('[Webhook] Delivered email failed:', e.message)
          );
        }
        break;

      case 9: // NDR / Undelivered
        if (!order.shipping.ndr) {
          order.shipping.ndr = { isNDR: false, ndrCount: 0, ndrActions: [] };
        }
        order.shipping.ndr.isNDR = true;
        order.shipping.ndr.ndrCount = (order.shipping.ndr.ndrCount || 0) + 1;
        order.shipping.ndr.lastNdrAt = new Date();
        order.shipping.ndr.lastNdrReason = payload.scans?.[0]?.activity || 'Undelivered';
        sendNDRAlertEmail(order, order.shipping.ndr.lastNdrReason).catch((e) =>
          console.error('[Webhook] NDR email failed:', e.message)
        );
        break;

      case 14: // RTO Initiated
        order.shipping.isRTO = true;
        order.shipping.rtoInitiatedAt = new Date();
        sendRTOAlertEmail(order).catch((e) =>
          console.error('[Webhook] RTO email failed:', e.message)
        );
        break;

      case 15: // RTO Delivered — restore stock
        order.shipping.rtoDeliveredAt = new Date();
        await restoreStockOnRTO(order);
        break;

      case 18: // Pickup Scheduled
        order.shipping.pickupScheduledDate = new Date();
        break;

      case 21: // Weight Discrepancy
        const reportedWeight = payload.charged_weight || payload.weight;
        order.shipping.errors.push({
          action: 'WEIGHT_DISCREPANCY',
          message: `Provider reported weight: ${reportedWeight}kg vs entered: ${order.shipping.weight}kg`,
        });
        sendWeightDisputeEmail(order, reportedWeight).catch((e) =>
          console.error('[Webhook] Weight dispute email failed:', e.message)
        );
        break;
    }

    await order.save();

    res.status(200).json({ status: 'processed' });
  } catch (error) {
    console.error('[Webhook] Processing error:', error.message);
    // Still return 200 to prevent retries
    res.status(200).json({ status: 'error', message: error.message });
  }
};

/**
 * Restore stock when RTO is delivered back (reuses cancel logic pattern).
 */
async function restoreStockOnRTO(order) {
  try {
    const items = order.modified && order.modifiedItems?.length > 0
      ? order.modifiedItems
      : order.orderItems;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      const sizeVariant = product.size.find(
        (s) => s.size.toLowerCase() === item.size.toLowerCase()
      );
      if (!sizeVariant) continue;

      // Restore stock
      sizeVariant.countInStock += item.qty;
      await product.save();

      // Record stock movement
      await StockMovement.create({
        product: product._id,
        productName: product.name,
        SKU: sizeVariant.SKU || `${product.name}-${sizeVariant.size}`,
        size: sizeVariant.size,
        type: 'RETURN',
        quantity: item.qty,
        previousStock: sizeVariant.countInStock - item.qty,
        newStock: sizeVariant.countInStock,
        reason: `RTO delivered - Order ${order.orderId}`,
        reference: {
          type: 'order',
          id: order._id,
          orderId: order.orderId,
        },
      });

      // Check stock alerts
      await handleStockAlerts(product, sizeVariant);
    }
  } catch (error) {
    console.error('[Webhook] Stock restoration failed for RTO:', error.message);
    order.shipping.errors.push({
      action: 'RTO_STOCK_RESTORE',
      message: error.message,
    });
  }
}
