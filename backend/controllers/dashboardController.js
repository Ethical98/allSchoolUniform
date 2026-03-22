import asyncHandler from 'express-async-handler';
import Order from '../models/OrderModel.js';
import User from '../models/UserModel.js';
import Cart from '../models/CartModel.js';
import Product from '../models/ProductModel.js';

// Helper: compute date range from period string
const getDateRange = (period, startDate, endDate) => {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = now;
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case 'month':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case '3months':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
      break;
    case 'custom':
      start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = endDate ? new Date(endDate) : now;
      // Set end to end of day
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
  }

  return { start, end };
};

// Helper: compute previous period for comparison
const getPreviousPeriod = (start, end) => {
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { prevStart, prevEnd };
};

// Helper: compute percentage change
const percentChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

// @desc    Get admin dashboard aggregated data
// @route   GET /api/orders/dashboard
// @access  Private/Admin
const getDashboardData = asyncHandler(async (req, res) => {
  const { period = 'month', startDate, endDate } = req.query;
  const { start, end } = getDateRange(period, startDate, endDate);
  const { prevStart, prevEnd } = getPreviousPeriod(start, end);

  // Run all queries in parallel for performance
  const [
    orderKpis,
    prevOrderKpis,
    revenueTrend,
    userTrend,
    newUsersCount,
    prevNewUsersCount,
    activeCarts,
    topProducts,
    recentOrders,
    activeProducts,
  ] = await Promise.all([
    // 1. Current period order KPIs
    Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $ne: ['$tracking.isCanceled', true] }, '$totalPrice', 0],
            },
          },
          paidOrders: { $sum: { $cond: ['$isPaid', 1, 0] } },
          unpaidOrders: { $sum: { $cond: ['$isPaid', 0, 1] } },
          pendingOrders: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$tracking.isConfirmed', true] },
                    { $ne: ['$tracking.isCanceled', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          confirmedOrders: { $sum: { $cond: [{ $eq: ['$tracking.isConfirmed', true] }, 1, 0] } },
          processingOrders: { $sum: { $cond: [{ $eq: ['$tracking.isProcessing', true] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$tracking.isDelivered', true] }, 1, 0] } },
          canceledOrders: { $sum: { $cond: [{ $eq: ['$tracking.isCanceled', true] }, 1, 0] } },
        },
      },
    ]),

    // 2. Previous period order KPIs (for comparison)
    Order.aggregate([
      { $match: { createdAt: { $gte: prevStart, $lte: prevEnd } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $ne: ['$tracking.isCanceled', true] }, '$totalPrice', 0],
            },
          },
        },
      },
    ]),

    // 3. Revenue trend (daily) – exclude canceled orders
    Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, 'tracking.isCanceled': { $ne: true } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, orderCount: 1 } },
    ]),

    // 4. New user trend (daily)
    User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, isAdmin: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', newUsers: 1 } },
    ]),

    // 5. New users count (current period)
    User.countDocuments({ createdAt: { $gte: start, $lte: end }, isAdmin: false }),

    // 6. New users count (previous period)
    User.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd }, isAdmin: false }),

    // 7. Active carts (updated in last 7 days)
    Cart.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),

    // 8. Top products by revenue – exclude canceled, use modifiedItems when modified, account for discount
    Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, 'tracking.isCanceled': { $ne: true } } },
      {
        $project: {
          items: {
            $cond: [{ $eq: ['$modified', true] }, '$modifiedItems', '$orderItems'],
          },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQty: { $sum: '$items.qty' },
          totalRevenue: {
            $sum: {
              $multiply: [
                { $subtract: ['$items.price', { $ifNull: ['$items.disc', 0] }] },
                '$items.qty',
              ],
            },
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, name: '$_id', totalQty: 1, totalRevenue: 1 } },
    ]),

    // 9. Recent orders
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderId name totalPrice orderStatus isPaid tracking createdAt')
      .lean(),

    // 10. Active products with stock data (for low-stock derivation)
    Product.find({ isActive: true })
      .select('name SKU size')
      .lean(),
  ]);

  // Extract KPI values (aggregation returns array, may be empty)
  const current = orderKpis[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    paidOrders: 0,
    unpaidOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    canceledOrders: 0,
  };
  const previous = prevOrderKpis[0] || { totalOrders: 0, totalRevenue: 0 };

  const avgOrderValue = current.totalOrders > 0
    ? Math.round(current.totalRevenue / current.totalOrders)
    : 0;
  const prevAvgOrderValue = previous.totalOrders > 0
    ? Math.round(previous.totalRevenue / previous.totalOrders)
    : 0;

  // Derive low-stock and out-of-stock from product variants (same logic as stock dashboard)
  const lowStockItems = [];
  let outOfStockCount = 0;
  for (const product of activeProducts) {
    for (const variant of product.size || []) {
      if (variant.outOfStock || variant.countInStock <= 0) {
        outOfStockCount++;
      }
      if (variant.alertOnQty && variant.alertOnQty > 0 && variant.countInStock <= variant.alertOnQty) {
        lowStockItems.push({
          productName: product.name,
          SKU: product.SKU,
          size: variant.size,
          currentStock: variant.countInStock,
          alertThreshold: variant.alertOnQty,
        });
      }
    }
  }
  lowStockItems.sort((a, b) => a.currentStock - b.currentStock);
  const topLowStockItems = lowStockItems.slice(0, 5);

  // Build order status distribution
  const orderStatusDistribution = [
    { status: 'Received', count: current.pendingOrders, color: '#f6c23e' },
    { status: 'Confirmed', count: current.confirmedOrders, color: '#4e73df' },
    { status: 'Processing', count: current.processingOrders, color: '#36b9cc' },
    { status: 'Delivered', count: current.deliveredOrders, color: '#1cc88a' },
    { status: 'Canceled', count: current.canceledOrders, color: '#e74a3b' },
  ].filter((s) => s.count > 0);

  res.json({
    kpis: {
      totalOrders: current.totalOrders,
      totalRevenue: Math.round(current.totalRevenue * 100) / 100,
      avgOrderValue,
      newUsers: newUsersCount,
      pendingOrders: current.pendingOrders,
      unpaidOrders: current.unpaidOrders,
      deliveredOrders: current.deliveredOrders,
      canceledOrders: current.canceledOrders,
      activeCarts,
    },
    comparison: {
      ordersChange: percentChange(current.totalOrders, previous.totalOrders),
      revenueChange: percentChange(current.totalRevenue, previous.totalRevenue),
      aovChange: percentChange(avgOrderValue, prevAvgOrderValue),
      newUsersChange: percentChange(newUsersCount, prevNewUsersCount),
    },
    revenueTrend,
    userTrend,
    orderStatusDistribution,
    topProducts,
    recentOrders,
    stockSummary: {
      lowStockCount: lowStockItems.length,
      outOfStockCount,
      activeAlerts: lowStockItems.length,
      lowStockItems: topLowStockItems,
    },
  });
});

export { getDashboardData };
