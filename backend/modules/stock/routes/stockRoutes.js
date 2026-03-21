import express from 'express';
import { protect, admin } from '../../../Middleware/authMiddleware.js';
import {
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
} from '../controllers/stockController.js';

const router = express.Router();

// All routes require admin auth
router.use(protect, admin);

// Dashboard
router.get('/dashboard', getStockDashboard);

// Stock Overview
router.get('/overview', getStockOverview);

// Product search for stock adjustment
router.get('/products/search', searchProducts);

// Product-specific stock
router.get('/product/:id', getProductStock);

// Stock Adjustments
router.post('/adjust', adjustStock);
router.post('/bulk-adjust', bulkAdjustStock);

// Stock Movements (audit log)
router.get('/movements', getStockMovements);
router.get('/movements/:productId', getProductMovements);

// Alerts
router.get('/alerts', getStockAlerts);
router.patch('/alerts/:id/acknowledge', acknowledgeAlert);

// Reports
router.get('/valuation/filters', getStockValuationFilters);
router.get('/valuation', getStockValuation);
router.get('/velocity', getSalesVelocity);

// Export
router.get('/export', exportStockData);

export default router;
