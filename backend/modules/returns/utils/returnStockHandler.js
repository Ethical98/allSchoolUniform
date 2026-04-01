import Product from '../../../models/ProductModel.js';
import StockMovement from '../../stock/models/StockMovementModel.js';
import { updateInventoryBucket } from '../../stock/utils/inventoryCalc.js';
import handleStockAlerts from '../../stock/utils/stockAlertHelper.js';

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

    if (item.qcDisposition === 'GOOD') {
      const result = await updateInventoryBucket({
        productId: item.product,
        size: item.size,
        increments: { quantityOnHand: item.returnQty },
      });

      await StockMovement.create({
        product: item.product,
        productName: item.productName,
        SKU: item.SKU || '',
        size: item.size,
        type: 'RETURN',
        quantityChange: item.returnQty,
        previousStock,
        newStock: previousStock + item.returnQty,
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
        qty: item.returnQty,
      });
    } else if (item.qcDisposition === 'DAMAGED') {
      const result = await updateInventoryBucket({
        productId: item.product,
        size: item.size,
        increments: { damaged: item.returnQty },
      });

      await StockMovement.create({
        product: item.product,
        productName: item.productName,
        SKU: item.SKU || '',
        size: item.size,
        type: 'RETURN',
        quantityChange: item.returnQty,
        previousStock: sizeVariant?.damaged || 0,
        newStock: (sizeVariant?.damaged || 0) + item.returnQty,
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
        qty: item.returnQty,
      });
    } else if (item.qcDisposition === 'UNSELLABLE') {
      // No inventory bucket change — write-off
      await StockMovement.create({
        product: item.product,
        productName: item.productName,
        SKU: item.SKU || '',
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
        qty: item.returnQty,
      });
    }

    processed++;
  }

  return { processed, skipped, results };
};

export default { processQCDispositions };
