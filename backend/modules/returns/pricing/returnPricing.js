/**
 * Return refund pricing — the single source of truth for all refund math.
 * Pure module: no DB access, no Mongoose. Safe to unit-test in isolation.
 *
 * Order/return items use field names: price (MRP), disc (discount %), tax (rate %).
 */

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const clampPct = (n) => Math.max(0, Math.min(100, Number(n) || 0));

/**
 * Quantity that QC accepted for an item — drives refund and restock.
 * Falls back to returnQty for legacy items with no acceptedQty.
 * @param {{ returnQty:number, acceptedQty?:number }} item
 * @returns {number}
 */
export const resolveQcQty = (item) =>
  Number.isFinite(item?.acceptedQty)
    ? item.acceptedQty
    : (Number(item?.returnQty) || 0);

/**
 * Refund for a single line = what the customer actually PAID for it.
 * Matches the order-details display (OrderItemsList): the discount is computed
 * on the whole line (price × qty) and rounded once, then subtracted — NOT
 * applied-and-rounded per unit, which would diverge by up to ₹1 (e.g. ₹99 @25%
 * ×2 paid 148, per-unit rounding gives 148.5 → 149).
 * Accepts `disc` (canonical) or `discount` (alias) for the discount percent.
 * @param {{ price:number, disc?:number, discount?:number }} item
 * @param {number} returnQty
 * @returns {number}
 */
export const computeItemRefund = (item, returnQty) => {
  const price = Number(item?.price) || 0;
  const disc = clampPct(item?.disc ?? item?.discount ?? 0);
  const qty = Number(returnQty) || 0;
  const lineMrp = price * qty;
  const lineDiscount = disc > 0 ? Math.round((lineMrp * disc) / 100) : 0;
  return round2(lineMrp - lineDiscount);
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
 * Shipping is never refunded by this function (always 0).
 * When `fullRefundOverride` is true, every item is refunded at its full
 * requested quantity, ignoring QC disposition and accepted-qty reductions.
 * @param {{ items:Array, fullRefundOverride?:boolean }} returnRequest
 * @returns {{ itemsRefund:number, shippingRefund:number, total:number }}
 */
export const computeReturnRefund = (returnRequest) => {
  const items = returnRequest?.items || [];
  const fullRefund = returnRequest?.fullRefundOverride === true;

  const itemsRefund = round2(
    items.reduce((sum, item) => {
      // Full refund: every item at full requested qty, ignore disposition zeroing.
      if (fullRefund) {
        return sum + computeItemRefund(item, item.returnQty);
      }
      // QC-adjusted: only refundable dispositions, at the accepted quantity.
      return isItemRefundable(item)
        ? sum + computeItemRefund(item, resolveQcQty(item))
        : sum;
    }, 0)
  );

  // Shipping is never refunded.
  return { itemsRefund, shippingRefund: 0, total: itemsRefund };
};
