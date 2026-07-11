// Status code priority (higher = further along the lifecycle). Mirrors the
// values previously inline in shippingWebhookController.js.
export const STATUS_PRIORITY = {
  6: 10,   // Shipped
  18: 15,  // Pickup Scheduled
  17: 20,  // Out for Delivery
  9: 25,   // NDR / Undelivered
  7: 30,   // Delivered
  14: 35,  // RTO Initiated
  15: 40,  // RTO Delivered
  21: 0,   // Weight Discrepancy (can happen anytime)
};

export const normalizeStatusText = (text) =>
  String(text ?? '').trim().toLowerCase();

// ShipRocket's track API returns a status string but no numeric code.
// Map the strings we act on back to the webhook's numeric codes.
const TEXT_TO_CODE = {
  'shipped': 6,
  'in transit': 6,
  'pickup scheduled': 18,
  'pickup generated': 18,
  'out for delivery': 17,
  'undelivered': 9,
  'ndr': 9,
  'delivered': 7,
  'rto initiated': 14,
  'rto in transit': 14,
  'rto delivered': 15,
  'rto': 14,
};

export const textToCode = (text) => {
  const key = normalizeStatusText(text);
  if (!key) return null;
  return TEXT_TO_CODE[key] ?? null;
};

const CANONICAL_TEXT = {
  6: 'Shipped',
  18: 'Pickup Scheduled',
  17: 'Out For Delivery',
  9: 'Undelivered',
  7: 'Delivered',
  14: 'RTO Initiated',
  15: 'RTO Delivered',
  21: 'Weight Discrepancy',
};

/**
 * Canonical status engine. Mutates `order` in place. Does NOT save or send email.
 * Returns { changed, previousStatusCode, sideEffects }.
 */
export const applyShipmentStatus = (order, meta = {}) => {
  const { code, text, location = '', remarks, edd, chargedWeight, scanDate } = meta;
  const resolvedCode = code ?? textToCode(text);
  const sideEffects = [];
  const previousStatusCode = order.shipping.statusCode;

  // Unmappable status: record the raw string for display, no transition.
  if (resolvedCode == null) {
    if (text) order.shipping.status = String(text);
    order.shipping.syncedAt = new Date();
    return { changed: false, previousStatusCode, sideEffects };
  }

  // Monotonicity: never regress to a lower/equal-priority state.
  // Code 21 (weight discrepancy) is allowed anytime.
  const currentPriority = STATUS_PRIORITY[previousStatusCode] ?? -1;
  const newPriority = STATUS_PRIORITY[resolvedCode] ?? -1;
  if (resolvedCode !== 21 && newPriority <= currentPriority) {
    return { changed: false, previousStatusCode, sideEffects };
  }

  // Apply canonical status + history.
  order.shipping.status = CANONICAL_TEXT[resolvedCode] || String(text || resolvedCode);
  order.shipping.statusCode = resolvedCode;
  order.shipping.syncedAt = new Date();
  if (edd) order.shipping.estimatedDeliveryDate = new Date(edd);

  order.shipping.trackingHistory.push({
    status: order.shipping.status,
    statusCode: resolvedCode,
    location,
    timestamp: scanDate ? new Date(scanDate) : new Date(),
    remarks: remarks || order.shipping.status,
  });

  switch (resolvedCode) {
    case 6: // Shipped
      order.tracking.isProcessing = true;
      order.tracking.processedAt = order.tracking.processedAt || new Date();
      order.orderStatus = 'Processing';
      sideEffects.push({ type: 'email', kind: 'shipped' });
      break;
    case 17: // Out for Delivery
      order.tracking.isOutForDelivery = true;
      order.tracking.outForDeliveryAt = new Date();
      order.orderStatus = 'Out For Delivery';
      sideEffects.push({ type: 'email', kind: 'ofd' });
      break;
    case 7: // Delivered
      order.tracking.isDelivered = true;
      order.tracking.deliveredAt = new Date();
      order.orderStatus = 'Delivered';
      if (order.shipping.ndr?.isNDR) order.shipping.ndr.isNDR = false;
      sideEffects.push({ type: 'email', kind: 'delivered' });
      break;
    case 9: // NDR
      if (!order.shipping.ndr) order.shipping.ndr = { isNDR: false, ndrCount: 0, ndrActions: [] };
      order.shipping.ndr.isNDR = true;
      order.shipping.ndr.ndrCount = (order.shipping.ndr.ndrCount || 0) + 1;
      order.shipping.ndr.lastNdrAt = new Date();
      order.shipping.ndr.lastNdrReason = remarks || 'Undelivered';
      sideEffects.push({ type: 'email', kind: 'ndr', reason: order.shipping.ndr.lastNdrReason });
      break;
    case 14: // RTO Initiated
      order.shipping.isRTO = true;
      order.shipping.rtoInitiatedAt = new Date();
      sideEffects.push({ type: 'email', kind: 'rto' });
      break;
    case 15: // RTO Delivered
      order.shipping.rtoDeliveredAt = new Date();
      sideEffects.push({ type: 'restoreStockOnRTO' });
      break;
    case 18: // Pickup Scheduled
      order.shipping.pickupScheduledDate = new Date();
      break;
    case 21: // Weight Discrepancy
      order.shipping.errors.push({
        action: 'WEIGHT_DISCREPANCY',
        message: `Provider reported weight: ${chargedWeight}kg vs entered: ${order.shipping.weight}kg`,
      });
      sideEffects.push({ type: 'email', kind: 'weight', chargedWeight });
      break;
  }

  return { changed: true, previousStatusCode, sideEffects };
};
