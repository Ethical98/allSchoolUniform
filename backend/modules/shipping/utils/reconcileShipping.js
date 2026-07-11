import Product from '../../../models/ProductModel.js';
import StockMovement from '../../stock/models/StockMovementModel.js';
import handleStockAlerts from '../../stock/utils/stockAlertHelper.js';
import { shippingApi } from './shippingClient.js';
import { applyShipmentStatus } from './shipmentStatus.js';

/**
 * Restore stock when an RTO shipment is delivered back. (Moved verbatim from the
 * webhook controller so track + reconcile can reuse it.)
 */
export const restoreStockOnRTO = async (order) => {
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
};

export default restoreStockOnRTO;

/**
 * Re-pull tracking for a single order and heal its status via the engine.
 * `sendEmails` defaults false so bulk backfills don't blast customers.
 * Returns { orderId, outcome } where outcome is 'healed' | 'unchanged' | 'no-track' | 'error'.
 */
export const reconcileOrder = async (order, { sendEmails = false } = {}) => {
  const awbCode = order.shipping?.awbCode;
  const shipmentId = order.shipping?.providerShipmentId;
  if (!awbCode && !shipmentId) return { orderId: order.orderId, outcome: 'no-track' };

  const endpoint = awbCode
    ? `/courier/track/awb/${awbCode}`
    : `/courier/track/shipment/${shipmentId}`;

  try {
    const data = await shippingApi('get', endpoint, { action: 'TRACK', orderId: order._id, asuOrderId: order.orderId, source: 'reconcile' });
    const latest = data?.tracking_data?.shipment_track?.[0];
    if (!latest) return { orderId: order.orderId, outcome: 'no-track' };

    if (!order.shipping.awbCode && latest.awb_code) order.shipping.awbCode = latest.awb_code;

    const { changed, sideEffects } = applyShipmentStatus(order, {
      text: latest.current_status,
      edd: latest.edd,
      location: latest.destination || '',
    });

    for (const fx of sideEffects) {
      if (fx.type === 'restoreStockOnRTO') await restoreStockOnRTO(order);
      // Emails intentionally suppressed unless sendEmails — wire in if needed.
    }

    await order.save();
    return { orderId: order.orderId, outcome: changed ? 'healed' : 'unchanged' };
  } catch (error) {
    return { orderId: order.orderId, outcome: 'error', error: error.message };
  }
};
