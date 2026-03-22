/**
 * Stock Management Utility Functions
 */

/**
 * Check if a size variant's stock is at or below its alert threshold.
 * @param {Object} sizeVariant - The size variant from ProductModel
 * @returns {boolean}
 */
export const isLowStock = (sizeVariant) => {
  if (!sizeVariant || !sizeVariant.alertOnQty || sizeVariant.alertOnQty <= 0) {
    return false;
  }
  return sizeVariant.countInStock <= sizeVariant.alertOnQty;
};

/**
 * Check if a size variant is out of stock.
 * @param {Object} sizeVariant - The size variant from ProductModel
 * @returns {boolean}
 */
export const isOutOfStock = (sizeVariant) => {
  return (
    !sizeVariant ||
    sizeVariant.countInStock <= 0 ||
    sizeVariant.outOfStock === true
  );
};

/**
 * Calculate total inventory valuation for an array of products.
 * @param {Array} products - Array of products from DB
 * @returns {Object} { totalItems, totalValue, costValue, potentialProfit }
 */
export const calculateInventoryValuation = (products) => {
  let totalItems = 0;
  let totalValue = 0;
  let costValue = 0;
  let totalOnHand = 0;
  let totalAvailable = 0;
  let totalCommitted = 0;
  let totalDamaged = 0;

  for (const product of products) {
    for (const variant of product.size || []) {
      const onHand = variant.quantityOnHand ?? variant.countInStock ?? 0;
      const available = variant.countInStock || 0;
      totalOnHand += onHand;
      totalAvailable += available;
      totalCommitted += variant.committed || 0;
      totalDamaged += variant.damaged || 0;
      totalItems += onHand;
      totalValue += onHand * (variant.price || 0);
      if (variant.costPrice) {
        costValue += onHand * variant.costPrice;
      }
    }
  }

  return {
    totalItems,
    totalOnHand,
    totalAvailable,
    totalCommitted,
    totalDamaged,
    totalValue: Math.round(totalValue * 100) / 100,
    costValue: Math.round(costValue * 100) / 100,
    potentialProfit: Math.round((totalValue - costValue) * 100) / 100,
  };
};

/**
 * Get a summary of stock status across all products.
 * @param {Array} products - Array of products from DB
 * @returns {Object} { totalProducts, totalVariants, inStock, outOfStock, lowStock }
 */
export const getStockSummary = (products) => {
  let totalVariants = 0;
  let inStock = 0;
  let outOfStock = 0;
  let lowStock = 0;

  for (const product of products) {
    for (const variant of product.size || []) {
      totalVariants++;
      if (isOutOfStock(variant)) {
        outOfStock++;
      } else if (isLowStock(variant)) {
        lowStock++;
        inStock++; // Low stock is still "in stock"
      } else {
        inStock++;
      }
    }
  }

  let totalOnHand = 0;
  for (const product of products) {
    for (const variant of product.size || []) {
      totalOnHand += variant.quantityOnHand ?? variant.countInStock ?? 0;
    }
  }

  return {
    totalProducts: products.length,
    totalVariants,
    inStock,
    outOfStock,
    lowStock,
    totalOnHand,
  };
};
