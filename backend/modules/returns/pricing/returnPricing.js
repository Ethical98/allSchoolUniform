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
