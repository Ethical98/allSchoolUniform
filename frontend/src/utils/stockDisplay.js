/**
 * Dynamic qty cap based on available stock (Amazon/Flipkart pattern).
 * Consumer-facing only — uses countInStock as the sole stock field.
 *
 * @param {number} countInStock - available stock for this variant
 * @param {number} [maxOrderQty] - optional per-variant admin override
 * @returns {number} max selectable quantity for the dropdown
 */
export const calcMaxOrderQty = (countInStock, maxOrderQty) => {
  if (maxOrderQty) return Math.min(maxOrderQty, countInStock);
  if (countInStock <= 0) return 0;
  if (countInStock <= 5) return countInStock;
  if (countInStock <= 20) return 5;
  if (countInStock <= 50) return 10;
  return Math.min(10, countInStock);
};

/**
 * Stock urgency tier for customer-facing display.
 * Exact count shown only when ≤10 to maintain urgency psychology.
 *
 * @param {number} countInStock - available stock for this variant
 * @returns {{ tier: string, message: string, badge: string }}
 */
export const getStockUrgency = (countInStock) => {
  if (countInStock <= 0)
    return { tier: 'OUT_OF_STOCK', message: 'Out of Stock', badge: 'danger' };
  if (countInStock <= 3)
    return {
      tier: 'CRITICAL',
      message: `Only ${countInStock} left - order soon!`,
      badge: 'danger',
    };
  if (countInStock <= 10)
    return {
      tier: 'LOW',
      message: `Only ${countInStock} left`,
      badge: 'warning',
    };
  if (countInStock <= 30)
    return { tier: 'LIMITED', message: 'Limited Stock', badge: 'warning' };
  return { tier: 'IN_STOCK', message: 'In Stock', badge: 'success' };
};
