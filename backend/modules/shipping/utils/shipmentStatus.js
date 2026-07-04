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
