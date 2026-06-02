import ReturnRequest from '../models/ReturnRequestModel.js';
import { decideShippingRefund, resolveOrderItems } from '../pricing/returnPricing.js';

export const RETURN_WINDOW_DAYS = 7;

/**
 * Validate that the order is eligible for a return.
 * Must be delivered and not cancelled.
 */
export const validateOrderEligibility = (order) => {
  if (!order) {
    throw new Error('Order not found');
  }

  if (!order.tracking?.isDelivered) {
    throw new Error('Order has not been delivered yet. Returns are only allowed for delivered orders.');
  }

  if (order.tracking?.isCanceled) {
    throw new Error('Order has been cancelled. Cannot create a return for a cancelled order.');
  }
};

/**
 * Validate the 7-day return window from delivery date.
 * Returns window info for the API response.
 *
 * @param {Object} order
 * @param {boolean} overrideReturnWindow - Admin override flag
 * @returns {{ returnWindowExpiresAt: Date, daysRemaining: number, isExpired: boolean }}
 */
export const validateReturnWindow = (order, overrideReturnWindow = false) => {
  const deliveredAt = order.tracking?.deliveredAt;

  if (!deliveredAt) {
    throw new Error('Delivery date not recorded on order. Cannot calculate return window.');
  }

  const deadline = new Date(
    deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
  const now = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  );
  const isExpired = now > deadline;

  if (isExpired && !overrideReturnWindow) {
    throw new Error(
      `Return window expired. Order was delivered on ${deliveredAt.toLocaleDateString('en-IN')} and the ${RETURN_WINDOW_DAYS}-day return window has passed.`
    );
  }

  return { returnWindowExpiresAt: deadline, daysRemaining, isExpired };
};

/**
 * Check that the requested return quantities do not exceed what is returnable.
 * Aggregates already-returned quantities across all non-REJECTED/CANCELLED returns.
 *
 * @param {string} orderId - MongoDB _id of the order
 * @param {Array} requestedItems - [{ product, size, returnQty }]
 * @param {Array} orderItems - The original order's items
 * @returns {void} throws if over-returning
 */
export const checkOverReturn = async (orderId, requestedItems, orderItems) => {
  // Fetch all active returns for this order
  const existingReturns = await ReturnRequest.find({
    order: orderId,
    status: { $nin: ['REJECTED', 'CANCELLED'] },
  }).lean();

  // Build a map of already-returned quantities: "productId:size" -> qty
  const returnedMap = {};
  for (const ret of existingReturns) {
    for (const item of ret.items) {
      const key = `${item.product}:${item.size}`;
      returnedMap[key] = (returnedMap[key] || 0) + item.returnQty;
    }
  }

  // Validate each requested item
  for (const reqItem of requestedItems) {
    const key = `${reqItem.product}:${reqItem.size}`;
    const alreadyReturned = returnedMap[key] || 0;

    // Find the original order item
    const orderItem = orderItems.find(
      (oi) =>
        oi.product.toString() === reqItem.product.toString() &&
        oi.size === reqItem.size
    );

    if (!orderItem) {
      throw new Error(
        `Item with product ${reqItem.product} size ${reqItem.size} not found in order`
      );
    }

    const originalQty = orderItem.qty;
    const remaining = originalQty - alreadyReturned;

    if (reqItem.returnQty > remaining) {
      throw new Error(
        `Cannot return ${reqItem.returnQty} unit(s) of "${orderItem.name}" (${reqItem.size}). ` +
          `Original: ${originalQty}, Already returned: ${alreadyReturned}, Remaining: ${remaining}`
      );
    }

    if (reqItem.returnQty <= 0) {
      throw new Error(
        `Return quantity must be at least 1 for "${orderItem.name}" (${reqItem.size})`
      );
    }
  }
};

/**
 * Validate that all QC dispositions are set (not PENDING) before QC_COMPLETED.
 */
export const validateQCCompleteness = (items) => {
  const pendingItems = items.filter(
    (item) => item.qcDisposition === 'PENDING'
  );

  if (pendingItems.length > 0) {
    const names = pendingItems
      .map((i) => `${i.productName} (${i.size})`)
      .join(', ');
    throw new Error(
      `QC disposition not set for: ${names}. All items must be inspected before completing QC.`
    );
  }
};

/**
 * Validate that the total refund does not exceed the order total.
 */
export const validateRefundTotal = (order, newRefundAmount) => {
  const totalRefundedSoFar = order.totalRefundedSoFar || 0;
  const maxRefundable = order.totalPrice - totalRefundedSoFar;

  if (newRefundAmount > maxRefundable + 0.01) {
    // 0.01 tolerance for floating-point
    throw new Error(
      `Refund amount (${newRefundAmount}) exceeds remaining refundable amount (${maxRefundable.toFixed(2)}). ` +
        `Order total: ${order.totalPrice}, Already refunded: ${totalRefundedSoFar}`
    );
  }
};

/**
 * Check if all order items have been fully returned.
 * Accepts optional pendingItems to account for items being created in the
 * current request (before they are saved to DB).
 *
 * @param {Object} order
 * @param {Array} pendingItems - [{ product, size, returnQty }] from the current unsaved request
 */
export const allOrderItemsReturned = async (order, pendingItems = []) => {
  const existingReturns = await ReturnRequest.find({
    order: order._id,
    status: { $nin: ['REJECTED', 'CANCELLED'] },
  }).lean();

  const returnedMap = {};

  // Count already-saved returns
  for (const ret of existingReturns) {
    for (const item of ret.items) {
      const key = `${item.product}:${item.size}`;
      returnedMap[key] = (returnedMap[key] || 0) + item.returnQty;
    }
  }

  // Add pending (current request) items
  for (const item of pendingItems) {
    const key = `${item.product}:${item.size}`;
    returnedMap[key] = (returnedMap[key] || 0) + item.returnQty;
  }

  // M3: measure "all returned" against what was actually billed/shipped.
  const sourceItems = resolveOrderItems(order);
  for (const orderItem of sourceItems) {
    const key = `${orderItem.product}:${orderItem.size}`;
    if ((returnedMap[key] || 0) < orderItem.qty) {
      return false;
    }
  }
  return true;
};

/**
 * Determine if shipping should be refunded.
 * Shipping is refunded on full returns OR seller-fault reasons.
 *
 * @param {Object} order
 * @param {string} reason
 * @param {Array} pendingItems - items from the current unsaved return request
 */
export const shouldRefundShipping = async (order, reason, pendingItems = []) => {
  if (decideShippingRefund(reason, false)) return true; // seller-fault short-circuit
  return await allOrderItemsReturned(order, pendingItems);
};

export default {
  RETURN_WINDOW_DAYS,
  validateOrderEligibility,
  validateReturnWindow,
  checkOverReturn,
  validateQCCompleteness,
  validateRefundTotal,
  allOrderItemsReturned,
  shouldRefundShipping,
};
