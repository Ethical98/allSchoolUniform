import Product from '../models/ProductModel.js';
import { normalizeUrl } from './normalizeUrl.js';

// Constants for pricing rules (shared with orderController)
const FREE_SHIPPING_THRESHOLD = 599;
const SHIPPING_CHARGE = 100;

/**
 * Validates order items against current stock and recalculates prices from DB.
 * Throws an Error if any item is out of stock, inactive, or not found.
 *
 * @param {Array} orderItems - Items from the client/Redis with { product, sizeVariant, size, qty, ... }
 * @returns {Object} { validatedOrderItems, itemsPrice, taxPrice, shippingPrice, totalPrice }
 */
export async function validateAndBuildOrder(orderItems) {
  if (!orderItems || orderItems.length === 0) {
    throw new Error('No order items');
  }

  // Fetch all products in one query
  const productIds = [...new Set(orderItems.map((item) => item.product))];
  const products = await Product.find({ _id: { $in: productIds } }).lean();

  const productMap = new Map();
  products.forEach((product) => {
    productMap.set(product._id.toString(), product);
  });

  const validatedOrderItems = [];
  let calculatedItemsPrice = 0;

  for (const item of orderItems) {
    const product = productMap.get(item.product);

    if (!product) {
      throw new Error(`Product not found: ${item.product}`);
    }

    if (!product.isActive) {
      throw new Error(`Product is not available: ${product.name}`);
    }

    // Find size variant by ID first, then by size string
    let sizeVariant = null;

    if (item.sizeVariant) {
      sizeVariant = product.size.find(
        (s) => s._id.toString() === item.sizeVariant
      );
    }

    if (!sizeVariant && item.size) {
      sizeVariant = product.size.find(
        (s) => s.size.toLowerCase() === item.size.toLowerCase()
      );
    }

    if (!sizeVariant) {
      throw new Error(
        `Size "${item.size}" not found for product: ${product.name}`
      );
    }

    // Stock check
    if (sizeVariant.outOfStock || sizeVariant.countInStock < item.qty) {
      throw new Error(
        `Insufficient stock for ${product.name} (Size: ${item.size})`
      );
    }

    // Recalculate price from DB
    const actualPrice = sizeVariant.price;
    const discountPercentage = sizeVariant.discount || 0;
    const discountedPrice =
      discountPercentage > 0
        ? actualPrice * (1 - discountPercentage / 100)
        : actualPrice;

    calculatedItemsPrice += discountedPrice * item.qty;

    validatedOrderItems.push({
      name: product.name,
      qty: item.qty,
      image: normalizeUrl(product.image),
      price: actualPrice,
      size: sizeVariant.size,
      sizeVariant: sizeVariant._id.toString(),
      product: item.product,
      schoolName: item.schoolName || product.schoolName?.[0] || '',
      disc: sizeVariant.discount || 0,
      tax: sizeVariant.tax || 0,
    });
  }

  const calculatedShippingPrice =
    calculatedItemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const calculatedTaxPrice = 0;
  const calculatedTotalPrice =
    calculatedItemsPrice + calculatedShippingPrice + calculatedTaxPrice;

  return {
    validatedOrderItems,
    itemsPrice: Math.round(calculatedItemsPrice * 100) / 100,
    taxPrice: Math.round(calculatedTaxPrice * 100) / 100,
    shippingPrice: Math.round(calculatedShippingPrice * 100) / 100,
    totalPrice: Math.round(calculatedTotalPrice * 100) / 100,
  };
}
