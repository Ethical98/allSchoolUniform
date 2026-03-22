import Product from '../../../models/ProductModel.js';

/**
 * Core formula: compute available stock from inventory buckets.
 * countInStock = max(0, quantityOnHand - committed - damaged - safetyStock)
 */
export const calcAvailable = (variant) => {
  const onHand = variant.quantityOnHand ?? variant.countInStock ?? 0;
  return Math.max(
    0,
    onHand -
      (variant.committed || 0) -
      (variant.damaged || 0) -
      (variant.safetyStock || 0)
  );
};

/**
 * Atomically update inventory bucket(s) on a size variant, recompute
 * countInStock and outOfStock in-memory, then save once.
 *
 * Callers that need additional mutations (e.g. lastRestockedAt, costPrice)
 * should pass them via `extraMutations(variant)` callback to avoid a second save.
 *
 * @param {Object} options
 * @param {string|ObjectId} options.productId
 * @param {string} options.size - size string to match in the size array
 * @param {Object} options.increments - e.g. { quantityOnHand: -5 } or { damaged: 3, quantityOnHand: -3 }
 * @param {Object} [options.session] - mongoose session for transactions
 * @param {Function} [options.extraMutations] - optional (variant, product) => void to mutate before save
 * @returns {{ product, variant }} or null if product/size not found
 */
export const updateInventoryBucket = async ({
  productId,
  size,
  increments,
  session,
  extraMutations,
}) => {
  const incUpdate = {};
  for (const [field, delta] of Object.entries(increments)) {
    incUpdate[`size.$.${field}`] = delta;
  }

  const opts = { new: true };
  if (session) opts.session = session;

  const product = await Product.findOneAndUpdate(
    { _id: productId, 'size.size': size },
    { $inc: incUpdate },
    opts
  );

  if (!product) return null;

  const variant = product.size.find((s) => s.size === size);
  if (variant) {
    variant.countInStock = calcAvailable(variant);
    variant.outOfStock = variant.countInStock <= 0;

    // Apply any caller-provided mutations before the single save
    if (extraMutations) extraMutations(variant, product);

    await product.save(session ? { session } : undefined);
  }

  return { product, variant };
};

export default { calcAvailable, updateInventoryBucket };
