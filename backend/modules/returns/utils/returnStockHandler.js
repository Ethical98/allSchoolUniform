import Product from '../../../models/ProductModel.js';
import StockMovement from '../../stock/models/StockMovementModel.js';
import { updateInventoryBucket } from '../../stock/utils/inventoryCalc.js';
import handleStockAlerts from '../../stock/utils/stockAlertHelper.js';
import { resolveQcQty } from '../pricing/returnPricing.js';

/**
 * Process QC dispositions and update stock accordingly.
 * Called when return status transitions to QC_COMPLETED.
 *
 * Uses qcProcessed flag per item to prevent double-restocking (concurrency guard).
 *
 * @param {Object} returnRequest - Mongoose ReturnRequest document
 * @param {Object} adminUser - { _id, name } of the admin performing QC
 * @returns {{ processed: number, skipped: number, results: Array }}
 */
export const processQCDispositions = async (returnRequest, adminUser) => {
  const results = [];
  let processed = 0;
  let skipped = 0;

  for (const item of returnRequest.items) {
    // Skip already-processed, pending, or not-received items
    if (
      item.qcProcessed ||
      item.qcDisposition === 'PENDING' ||
      item.qcDisposition === 'NOT_RECEIVED'
    ) {
      skipped++;
      results.push({
        product: item.product,
        size: item.size,
        disposition: item.qcDisposition,
        action: item.qcProcessed ? 'already_processed' : 'skipped',
      });
      continue;
    }

    // Atomic concurrency guard: mark as processed before stock update
    const updated = await returnRequest.constructor.findOneAndUpdate(
      { _id: returnRequest._id, 'items._id': item._id, 'items.qcProcessed': false },
      { $set: { 'items.$.qcProcessed': true } },
      { new: true }
    );

    if (!updated) {
      // Another process already handled this item
      skipped++;
      results.push({
        product: item.product,
        size: item.size,
        disposition: item.qcDisposition,
        action: 'already_processed',
      });
      continue;
    }

    // Also update the in-memory document
    item.qcProcessed = true;

    // Fetch product for stock snapshot
    const product = await Product.findById(item.product);
    const sizeVariant = product?.size?.find((s) => s.size === item.size);
    const previousStock = sizeVariant?.quantityOnHand || 0;

    // StockMovement.SKU is a required string; the return item's denormalized SKU
    // comes from the order's productCode, which can be blank. Fall back to the
    // product's canonical (required, unique) SKU so QC completion never fails
    // validation on an empty SKU.
    const movementSKU = item.SKU || product?.SKU || 'UNKNOWN';

    const qty = resolveQcQty(item);
    if (qty <= 0) {
      // Nothing accepted for this item — no stock movement, no refund qty.
      results.push({
        product: item.product,
        size: item.size,
        disposition: item.qcDisposition,
        action: 'zero_accepted_qty',
      });
      processed++;
      continue;
    }

    if (item.qcDisposition === 'GOOD') {
      const result = await updateInventoryBucket({
        productId: item.product,
        size: item.size,
        increments: { quantityOnHand: qty },
      });

      await StockMovement.create({
        product: item.product,
        productName: item.productName,
        SKU: movementSKU,
        size: item.size,
        type: 'RETURN',
        quantityChange: qty,
        previousStock,
        newStock: previousStock + qty,
        order: returnRequest.order,
        orderId: returnRequest.orderId,
        returnRequest: returnRequest._id,
        reason: `Return ${returnRequest.returnId} - QC: GOOD`,
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        bucketChanged: 'quantityOnHand',
        onHandAfter: result?.variant?.quantityOnHand,
      });

      if (result?.product) {
        await handleStockAlerts(
          result.product,
          item.size,
          result.variant.countInStock
        );
      }

      results.push({
        product: item.product,
        size: item.size,
        disposition: 'GOOD',
        action: 'restocked_to_quantityOnHand',
        qty,
      });
    } else if (item.qcDisposition === 'DAMAGED') {
      const result = await updateInventoryBucket({
        productId: item.product,
        size: item.size,
        increments: { damaged: qty },
      });

      await StockMovement.create({
        product: item.product,
        productName: item.productName,
        SKU: movementSKU,
        size: item.size,
        type: 'RETURN',
        quantityChange: qty,
        previousStock: sizeVariant?.damaged || 0,
        newStock: (sizeVariant?.damaged || 0) + qty,
        order: returnRequest.order,
        orderId: returnRequest.orderId,
        returnRequest: returnRequest._id,
        reason: `Return ${returnRequest.returnId} - QC: DAMAGED`,
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        bucketChanged: 'damaged',
        onHandAfter: result?.variant?.quantityOnHand,
      });

      results.push({
        product: item.product,
        size: item.size,
        disposition: 'DAMAGED',
        action: 'added_to_damaged_bucket',
        qty,
      });
    } else if (item.qcDisposition === 'UNSELLABLE') {
      // Zero out refund for unsellable items — cannot refund for items that cannot be resold
      item.refundAmount = 0;

      // No inventory bucket change — write-off
      await StockMovement.create({
        product: item.product,
        productName: item.productName,
        SKU: movementSKU,
        size: item.size,
        type: 'DAMAGE',
        quantityChange: 0,
        previousStock,
        newStock: previousStock,
        order: returnRequest.order,
        orderId: returnRequest.orderId,
        returnRequest: returnRequest._id,
        reason: `Return ${returnRequest.returnId} - QC: UNSELLABLE (written off)`,
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        notes: `Unsellable return item - ${item.qcNotes || 'no notes'}`,
      });

      results.push({
        product: item.product,
        size: item.size,
        disposition: 'UNSELLABLE',
        action: 'written_off',
        qty,
      });
    }

    processed++;
  }

  return { processed, skipped, results };
};

export default { processQCDispositions };
