import StockAlert from '../models/StockAlertModel.js';

/**
 * Check and create/resolve stock alerts after a stock change.
 * Shared utility used by stock controller, order controller, and billing controller.
 */
const handleStockAlerts = async (product, size, newStock) => {
  const sizeVariant = product.size.find((s) => s.size === size);
  if (!sizeVariant) return;

  const alertThreshold = sizeVariant.alertOnQty || 0;

  if (alertThreshold > 0 && newStock <= alertThreshold) {
    // Atomic upsert: prevents duplicate active alerts from concurrent requests
    await StockAlert.findOneAndUpdate(
      { product: product._id, size, status: 'ACTIVE' },
      {
        $set: { currentStock: newStock },
        $setOnInsert: {
          productName: product.name,
          SKU: product.SKU,
          alertThreshold,
        },
      },
      { upsert: true, new: true }
    );
  } else if (alertThreshold > 0 && newStock > alertThreshold) {
    // Resolve all active alerts and re-activate resolved ones won't be needed —
    // if stock drops again later, a new alert is created via upsert above
    await StockAlert.updateMany(
      { product: product._id, size, status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] } },
      { status: 'RESOLVED', resolvedAt: new Date() }
    );
  }
};

export default handleStockAlerts;
