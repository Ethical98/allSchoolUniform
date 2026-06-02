/**
 * Return refund pricing — the single source of truth for all refund math.
 * Pure module: no DB access, no Mongoose. Safe to unit-test in isolation.
 *
 * Order/return items use field names: price (MRP), disc (discount %), tax (rate %).
 */

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const clampPct = (n) => Math.max(0, Math.min(100, Number(n) || 0));

/**
 * Refund for a single line: price × (1 - disc%) × qty, rounded to 2dp.
 * Accepts `disc` (canonical) or `discount` (alias) for the discount percent.
 * @param {{ price:number, disc?:number, discount?:number }} item
 * @param {number} returnQty
 * @returns {number}
 */
export const computeItemRefund = (item, returnQty) => {
  const price = Number(item?.price) || 0;
  const disc = clampPct(item?.disc ?? item?.discount ?? 0);
  const unit = round2(price * (1 - disc / 100));
  return round2(unit * (Number(returnQty) || 0));
};

/**
 * Which item list is the source of truth for a return.
 * M3: when the order was modified post-purchase, return against what was
 * actually billed/shipped (modifiedItems); otherwise the original orderItems.
 * @param {{ modified?:boolean, orderItems:Array, modifiedItems?:Array }} order
 * @returns {Array}
 */
export const resolveOrderItems = (order) => {
  if (order?.modified && Array.isArray(order.modifiedItems) && order.modifiedItems.length > 0) {
    return order.modifiedItems;
  }
  return order?.orderItems || [];
};

// Dispositions that produce zero refund (item not refundable).
const ZERO_REFUND_DISPOSITIONS = new Set(['NOT_RECEIVED', 'UNSELLABLE']);

/**
 * True when a return item should be refunded given its QC disposition.
 * Items with no disposition yet (undefined/PENDING) are refundable.
 */
export const isItemRefundable = (item) =>
  !ZERO_REFUND_DISPOSITIONS.has(item?.qcDisposition);

/**
 * Total refund for a return request, honoring per-item QC dispositions.
 * Shipping refund is read from the return (set at create time by
 * shouldRefundShipping); this function does not recompute it.
 * @param {{ items:Array, shippingRefundAmount?:number }} returnRequest
 * @returns {{ itemsRefund:number, shippingRefund:number, total:number }}
 */
export const computeReturnRefund = (returnRequest) => {
  const items = returnRequest?.items || [];
  const itemsRefund = round2(
    items.reduce(
      (sum, item) =>
        isItemRefundable(item)
          ? sum + computeItemRefund(item, item.returnQty)
          : sum,
      0
    )
  );
  const shippingRefund = round2(Number(returnRequest?.shippingRefundAmount) || 0);
  return { itemsRefund, shippingRefund, total: round2(itemsRefund + shippingRefund) };
};

// Reasons where the seller is at fault → shipping is always refunded.
export const SELLER_FAULT_REASONS = new Set([
  'DEFECTIVE',
  'WRONG_ITEM',
  'DAMAGED_IN_TRANSIT',
]);

/**
 * Pure shipping-refund decision.
 * @param {string} reason - return reason
 * @param {boolean} allItemsReturned - whether every order item is fully returned
 * @returns {boolean}
 */
export const decideShippingRefund = (reason, allItemsReturned) =>
  SELLER_FAULT_REASONS.has(reason) || Boolean(allItemsReturned);
