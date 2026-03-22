import asyncHandler from 'express-async-handler';
import Product from '../../../models/ProductModel.js';
import StockMovement from '../models/StockMovementModel.js';
import StockAlert from '../models/StockAlertModel.js';
import {
  isLowStock,
  isOutOfStock,
  calculateInventoryValuation,
  getStockSummary,
} from '../utils/stockUtils.js';
import handleStockAlerts from '../utils/stockAlertHelper.js';
import { updateInventoryBucket } from '../utils/inventoryCalc.js';
import { escapeRegex } from '../../../utils/stringUtils.js';

// ============================================================
// @desc    Get stock dashboard stats
// @route   GET /api/stock/dashboard
// @access  Private/Admin
// ============================================================
const getStockDashboard = asyncHandler(async (req, res) => {
  const { season } = req.query;
  const filter = { isActive: true };
  if (season) {
    filter.season = { $in: [season, 'All Season'] };
  }

  // Get active products (filtered by season if provided)
  const products = await Product.find(filter).select(
    'name SKU size schoolName type season'
  );

  // Stock summary
  const summary = getStockSummary(products);

  // Inventory valuation
  const valuation = calculateInventoryValuation(products);

  // Active alerts count
  const activeAlerts = await StockAlert.countDocuments({ status: 'ACTIVE' });

  // Recent movements (last 10, capped)
  const recentMovements = await StockMovement.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()
    .select('productName SKU size type quantityChange newStock createdAt performedByName reason');

  // Top low-stock items (up to 20)
  const lowStockItems = [];
  for (const product of products) {
    for (const variant of product.size || []) {
      if (isLowStock(variant) || isOutOfStock(variant)) {
        lowStockItems.push({
          productId: product._id,
          productName: product.name,
          SKU: product.SKU,
          size: variant.size,
          currentStock: variant.countInStock,
          alertThreshold: variant.alertOnQty || 0,
          schoolName: product.schoolName,
        });
      }
    }
  }
  // Sort by how critically low (lowest stock first)
  lowStockItems.sort((a, b) => a.currentStock - b.currentStock);

  res.json({
    summary,
    valuation,
    activeAlerts,
    recentMovements,
    lowStockItems: lowStockItems.slice(0, 20),
  });
});

// ============================================================
// @desc    Get stock overview (all products with stock)
// @route   GET /api/stock/overview
// @access  Private/Admin
// ============================================================
const getStockOverview = asyncHandler(async (req, res) => {
  const pageSize = 25;
  const page = Number(req.query.page) || 1;
  const { school, type, search, stockStatus, size, season } = req.query;

  // Build filter
  const filter = { isActive: true };

  if (school) {
    filter.schoolName = { $regex: escapeRegex(school), $options: 'i' };
  }
  if (type) {
    filter.type = { $regex: escapeRegex(type), $options: 'i' };
  }
  if (search) {
    const escapedSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { SKU: { $regex: escapedSearch, $options: 'i' } },
    ];
  }
  if (size) {
    filter['size.size'] = { $regex: `^${escapeRegex(size)}$`, $options: 'i' };
  }
  if (season) {
    filter.season = { $in: [season, 'All Season'] };
  }

  if (stockStatus) {
    // When stock status filter is active, fetch all then filter in-memory
    // (stock status depends on nested size array logic)
    // Use .lean() to reduce memory overhead for large result sets
    let allProducts = await Product.find(filter)
      .select('name SKU size schoolName type season category image outOfStock')
      .sort({ name: 1 })
      .lean();

    if (stockStatus === 'low') {
      allProducts = allProducts.filter((p) =>
        p.size.some((s) => isLowStock(s))
      );
    } else if (stockStatus === 'out') {
      allProducts = allProducts.filter((p) => {
        const totalStock = (p.size || []).reduce((sum, s) => sum + (s.countInStock || 0), 0);
        return totalStock <= 0;
      });
    } else if (stockStatus === 'in') {
      allProducts = allProducts.filter((p) => {
        const totalStock = (p.size || []).reduce((sum, s) => sum + (s.countInStock || 0), 0);
        if (totalStock <= 0) return false;
        const hasLow = p.size.some((s) => isLowStock(s));
        return !hasLow;
      });
    }

    const filteredCount = allProducts.length;
    const products = allProducts.slice(pageSize * (page - 1), pageSize * page);

    res.json({
      products,
      page,
      pages: Math.ceil(filteredCount / pageSize),
      total: filteredCount,
    });
  } else {
    // No stock status filter — use efficient DB pagination
    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .select('name SKU size schoolName type season category image outOfStock')
      .sort({ name: 1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  }
});

// ============================================================
// @desc    Get detailed stock for a single product
// @route   GET /api/stock/product/:id
// @access  Private/Admin
// ============================================================
const getProductStock = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select(
    'name SKU size schoolName type category image outOfStock'
  );

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Get recent movements for this product
  const movements = await StockMovement.find({ product: req.params.id })
    .sort({ createdAt: -1 })
    .limit(50);

  // Get active alerts for this product
  const alerts = await StockAlert.find({
    product: req.params.id,
    status: 'ACTIVE',
  });

  res.json({
    product,
    movements,
    alerts,
  });
});

// ============================================================
// @desc    Adjust stock for a product size variant
// @route   POST /api/stock/adjust
// @access  Private/Admin
// ============================================================
const adjustStock = asyncHandler(async (req, res) => {
  const { productId, size, quantityChange, type, reason, notes, costPrice } = req.body;

  // Validate required fields
  if (!productId || !size || quantityChange === undefined || !type) {
    res.status(400);
    throw new Error('Product ID, size, quantity change, and type are required');
  }

  // Validate size is a non-empty string
  if (typeof size !== 'string' || size.trim().length === 0) {
    res.status(400);
    throw new Error('Size must be a non-empty string');
  }

  // Validate type
  const validTypes = [
    'PURCHASE',
    'RETURN',
    'DAMAGE',
    'CORRECTION',
    'TRANSFER',
    'OPENING_STOCK',
    'SAFETY_STOCK',
  ];
  if (!validTypes.includes(type)) {
    res.status(400);
    throw new Error(
      `Invalid adjustment type. Must be one of: ${validTypes.join(', ')}`
    );
  }

  // Validate quantity
  const qty = Number(quantityChange);
  if (isNaN(qty) || qty === 0) {
    res.status(400);
    throw new Error('Quantity change must be a non-zero number');
  }

  // Find the product to validate and get previous state
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const sizeVariant = product.size.find((s) => s.size === size);
  if (!sizeVariant) {
    res.status(404);
    throw new Error(`Size "${size}" not found for this product`);
  }

  const previousStock = sizeVariant.countInStock;

  // Prevent negative quantityOnHand (unless it's a correction)
  const currentOnHand = sizeVariant.quantityOnHand || sizeVariant.countInStock || 0;
  if (type !== 'CORRECTION' && type !== 'DAMAGE' && type !== 'SAFETY_STOCK') {
    if (currentOnHand + qty < 0) {
      res.status(400);
      throw new Error(
        `Cannot reduce stock below 0. Current on-hand: ${currentOnHand}, attempted change: ${qty}`
      );
    }
  }

  // Map adjustment type to inventory bucket increments
  let increments;
  let bucketChanged;
  if (type === 'DAMAGE') {
    increments = { damaged: Math.abs(qty), quantityOnHand: -Math.abs(qty) };
    bucketChanged = 'damaged';
  } else if (type === 'SAFETY_STOCK') {
    increments = { safetyStock: qty };
    bucketChanged = 'safetyStock';
  } else {
    increments = { quantityOnHand: qty };
    bucketChanged = 'quantityOnHand';
  }

  const result = await updateInventoryBucket({
    productId,
    size,
    increments,
    extraMutations: (variant) => {
      // Update lastRestockedAt if this is an inflow
      if (qty > 0 && ['PURCHASE', 'RETURN', 'OPENING_STOCK'].includes(type)) {
        variant.lastRestockedAt = new Date();
      }
      // Update costPrice if provided (for inflow adjustments)
      if (costPrice !== undefined && costPrice !== null && costPrice !== '') {
        const costVal = Number(costPrice);
        if (!isNaN(costVal) && costVal >= 0 && ['PURCHASE', 'RETURN', 'OPENING_STOCK'].includes(type)) {
          variant.costPrice = costVal;
        }
      }
    },
  });

  if (!result) {
    res.status(404);
    throw new Error('Failed to update inventory');
  }

  const { product: updatedProduct, variant: updatedVariant } = result;

  // Create stock movement record
  const movement = await StockMovement.create({
    product: updatedProduct._id,
    productName: updatedProduct.name,
    SKU: updatedProduct.SKU || '',
    size,
    type,
    quantityChange: qty,
    previousStock,
    newStock: updatedVariant.countInStock,
    reason: reason || '',
    performedBy: req.user._id,
    performedByName: req.user.name,
    notes: notes || '',
    bucketChanged,
    onHandAfter: updatedVariant.quantityOnHand,
  });

  // Handle alerts
  await handleStockAlerts(updatedProduct, size, updatedVariant.countInStock);

  res.status(201).json({
    message: 'Stock adjusted successfully',
    movement,
    currentStock: updatedVariant.countInStock,
    quantityOnHand: updatedVariant.quantityOnHand,
  });
});

// ============================================================
// @desc    Bulk adjust stock (multiple products/sizes)
// @route   POST /api/stock/bulk-adjust
// @access  Private/Admin
// ============================================================
const bulkAdjustStock = asyncHandler(async (req, res) => {
  const { adjustments, type, reason } = req.body;

  if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
    res.status(400);
    throw new Error('Adjustments array is required and must not be empty');
  }

  const validTypes = [
    'PURCHASE',
    'RETURN',
    'DAMAGE',
    'CORRECTION',
    'OPENING_STOCK',
    'SAFETY_STOCK',
  ];
  if (!validTypes.includes(type)) {
    res.status(400);
    throw new Error(
      `Invalid adjustment type. Must be one of: ${validTypes.join(', ')}`
    );
  }

  const results = [];
  const errors = [];

  for (const adj of adjustments) {
    try {
      const { productId, size, quantityChange } = adj;
      const qty = Number(quantityChange);

      if (!productId || !size || isNaN(qty) || qty === 0) {
        errors.push({
          productId,
          size,
          error: 'Invalid data: productId, size, and non-zero quantityChange required',
        });
        continue;
      }

      // Get previous state
      const productBefore = await Product.findById(productId);
      if (!productBefore) {
        errors.push({ productId, size, error: 'Product not found' });
        continue;
      }
      const variantBefore = productBefore.size.find((s) => s.size === size);
      if (!variantBefore) {
        errors.push({ productId, size, error: `Size "${size}" not found` });
        continue;
      }
      const previousStock = variantBefore.countInStock;

      // Map type to bucket increments
      let increments;
      let bucketChanged;
      if (type === 'DAMAGE') {
        increments = { damaged: Math.abs(qty), quantityOnHand: -Math.abs(qty) };
        bucketChanged = 'damaged';
      } else if (type === 'SAFETY_STOCK') {
        increments = { safetyStock: qty };
        bucketChanged = 'safetyStock';
      } else {
        increments = { quantityOnHand: qty };
        bucketChanged = 'quantityOnHand';
      }

      const result = await updateInventoryBucket({
        productId,
        size,
        increments,
        extraMutations: (variant) => {
          if (qty > 0 && ['PURCHASE', 'RETURN', 'OPENING_STOCK'].includes(type)) {
            variant.lastRestockedAt = new Date();
          }
        },
      });
      if (!result) {
        errors.push({ productId, size, error: 'Failed to update inventory' });
        continue;
      }

      const { product, variant: updatedVariant } = result;

      const movement = await StockMovement.create({
        product: product._id,
        productName: product.name,
        SKU: product.SKU || '',
        size,
        type,
        quantityChange: qty,
        previousStock,
        newStock: updatedVariant.countInStock,
        reason: reason || '',
        performedBy: req.user._id,
        performedByName: req.user.name,
        notes: adj.notes || '',
        bucketChanged,
        onHandAfter: updatedVariant.quantityOnHand,
      });

      await handleStockAlerts(product, size, updatedVariant.countInStock);

      results.push({
        productId,
        productName: product.name,
        size,
        previousStock,
        newStock: updatedVariant.countInStock,
        movementId: movement._id,
      });
    } catch (err) {
      errors.push({
        productId: adj.productId,
        size: adj.size,
        error: err.message,
      });
    }
  }

  res.status(201).json({
    message: `Processed ${results.length} adjustments, ${errors.length} errors`,
    results,
    errors,
  });
});

// ============================================================
// @desc    Get stock movements (audit log)
// @route   GET /api/stock/movements
// @access  Private/Admin
// ============================================================
const getStockMovements = asyncHandler(async (req, res) => {
  const pageSize = 25;
  const page = Number(req.query.page) || 1;
  const { search, productId, type, startDate, endDate } = req.query;

  const filter = {};

  if (productId) {
    filter.product = productId;
  }
  if (search) {
    const escapedSearch = escapeRegex(search);
    filter.$or = [
      { productName: { $regex: escapedSearch, $options: 'i' } },
      { SKU: { $regex: escapedSearch, $options: 'i' } },
    ];
  }
  if (type) {
    filter.type = type;
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const count = await StockMovement.countDocuments(filter);
  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    movements,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// ============================================================
// @desc    Get movements for a specific product
// @route   GET /api/stock/movements/:productId
// @access  Private/Admin
// ============================================================
const getProductMovements = asyncHandler(async (req, res) => {
  const pageSize = 25;
  const page = Number(req.query.page) || 1;
  const { size } = req.query;

  const filter = { product: req.params.productId };
  if (size) {
    filter.size = size;
  }

  const count = await StockMovement.countDocuments(filter);
  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    movements,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// ============================================================
// @desc    Get active stock alerts
// @route   GET /api/stock/alerts
// @access  Private/Admin
// ============================================================
const getStockAlerts = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  } else {
    filter.status = 'ACTIVE'; // Default to active alerts
  }

  const alerts = await StockAlert.find(filter).sort({ createdAt: -1 }).limit(200);

  res.json({ alerts, total: alerts.length });
});

// ============================================================
// @desc    Acknowledge a stock alert
// @route   PATCH /api/stock/alerts/:id/acknowledge
// @access  Private/Admin
// ============================================================
const acknowledgeAlert = asyncHandler(async (req, res) => {
  const alert = await StockAlert.findById(req.params.id);

  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  if (alert.status !== 'ACTIVE') {
    res.status(400);
    throw new Error('Alert is not active');
  }

  alert.status = 'ACKNOWLEDGED';
  alert.acknowledgedBy = req.user._id;
  alert.acknowledgedAt = new Date();

  await alert.save();

  res.json({ message: 'Alert acknowledged', alert });
});

// ============================================================
// @desc    Get distinct schools and types for valuation filters
// @route   GET /api/stock/valuation/filters
// @access  Private/Admin
// ============================================================
const getStockValuationFilters = asyncHandler(async (req, res) => {
  const schools = await Product.distinct('schoolName', { isActive: true });
  const types = await Product.distinct('type', { isActive: true });
  res.json({ schools: schools.sort(), types: types.sort() });
});

// ============================================================
// @desc    Get inventory valuation
// @route   GET /api/stock/valuation
// @access  Private/Admin
// ============================================================
const getStockValuation = asyncHandler(async (req, res) => {
  const { school, type } = req.query;
  const filter = { isActive: true };

  if (school) {
    filter.schoolName = { $regex: escapeRegex(school), $options: 'i' };
  }
  if (type) {
    filter.type = { $regex: escapeRegex(type), $options: 'i' };
  }

  const products = await Product.find(filter).select('name SKU size schoolName type');
  const valuation = calculateInventoryValuation(products);

  // Per-product breakdown
  const breakdown = products.map((p) => ({
    productId: p._id,
    name: p.name,
    SKU: p.SKU,
    schoolName: p.schoolName,
    type: p.type,
    variants: (p.size || []).map((v) => ({
      size: v.size,
      qty: v.countInStock,
      price: v.price,
      costPrice: v.costPrice || 0,
      value: v.countInStock * v.price,
      costValue: v.countInStock * (v.costPrice || 0),
    })),
  }));

  res.json({
    valuation,
    breakdown,
  });
});

// ============================================================
// @desc    Get sales velocity report
// @route   GET /api/stock/velocity
// @access  Private/Admin
// ============================================================
const DEFAULT_VELOCITY_DAYS = 30;

const getSalesVelocity = asyncHandler(async (req, res) => {
  const { days = DEFAULT_VELOCITY_DAYS } = req.query;
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - Number(days));

  // Get all SALE movements in the period
  const salesMovements = await StockMovement.aggregate([
    {
      $match: {
        type: 'SALE',
        createdAt: { $gte: sinceDate },
      },
    },
    {
      $group: {
        _id: { product: '$product', productName: '$productName', SKU: '$SKU', size: '$size' },
        totalSold: { $sum: { $abs: '$quantityChange' } },
        orderCount: { $sum: 1 },
      },
    },
    {
      $sort: { totalSold: -1 },
    },
    {
      $limit: 50,
    },
  ]);

  const velocity = salesMovements.map((item) => ({
    productId: item._id.product,
    productName: item._id.productName,
    SKU: item._id.SKU,
    size: item._id.size,
    totalSold: item.totalSold,
    orderCount: item.orderCount,
    avgPerDay: Math.round((item.totalSold / Number(days)) * 100) / 100,
  }));

  res.json({
    period: `${days} days`,
    since: sinceDate,
    velocity,
  });
});

// ============================================================
// @desc    Export stock data as CSV
// @route   GET /api/stock/export
// @access  Private/Admin
// ============================================================
const exportStockData = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true })
    .select('name SKU size schoolName type category')
    .sort({ name: 1 });

  // Build CSV
  const headers = [
    'Product Name',
    'SKU',
    'School',
    'Type',
    'Category',
    'Size',
    'On Hand',
    'Committed',
    'Damaged',
    'Safety Stock',
    'Available',
    'Max Order Qty',
    'Price',
    'Cost Price',
    'Alert Qty',
    'Last Restocked',
    'Status',
  ];

  let csv = headers.join(',') + '\n';
  const esc = (str) => String(str || '').replace(/"/g, '""');

  for (const product of products) {
    for (const variant of product.size || []) {
      const status =
        variant.countInStock <= 0 || variant.outOfStock
          ? 'Out of Stock'
          : variant.alertOnQty && variant.countInStock <= variant.alertOnQty
            ? 'Low Stock'
            : 'In Stock';
      const row = [
        `"${esc(product.name)}"`,
        `"${esc(product.SKU)}"`,
        `"${esc((product.schoolName || []).join(', '))}"`,
        `"${esc(product.type)}"`,
        `"${esc(product.category)}"`,
        `"${esc(variant.size)}"`,
        variant.quantityOnHand ?? variant.countInStock ?? 0,
        variant.committed || 0,
        variant.damaged || 0,
        variant.safetyStock || 0,
        variant.countInStock,
        variant.maxOrderQty || '',
        variant.price,
        variant.costPrice || '',
        variant.alertOnQty || '',
        variant.lastRestockedAt
          ? new Date(variant.lastRestockedAt).toLocaleDateString('en-IN')
          : '',
        status,
      ];
      csv += row.join(',') + '\n';
    }
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=stock-export-${new Date().toISOString().split('T')[0]}.csv`
  );
  res.send(csv);
});

// ============================================================
// @desc    Search products for stock adjustment (no isActive filter, searches name + SKU)
// @route   GET /api/stock/products/search
// @access  Private/Admin
// ============================================================
const searchProducts = asyncHandler(async (req, res) => {
  const { search } = req.query;

  if (!search || search.length < 2) {
    res.json([]);
    return;
  }

  const escapedSearch = escapeRegex(search);
  const products = await Product.find({
    $or: [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { SKU: { $regex: escapedSearch, $options: 'i' } },
    ],
  })
    .select('name SKU size type schoolName image')
    .limit(Math.min(50, 100))
    .sort({ name: 1 });

  res.json(products);
});

export {
  getStockDashboard,
  getStockOverview,
  getProductStock,
  adjustStock,
  bulkAdjustStock,
  getStockMovements,
  getProductMovements,
  getStockAlerts,
  acknowledgeAlert,
  getStockValuation,
  getStockValuationFilters,
  getSalesVelocity,
  exportStockData,
  searchProducts,
};
