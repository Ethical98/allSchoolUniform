import express from 'express';
import { protect, admin } from '../../../Middleware/authMiddleware.js';
import {
  checkServiceability,
  createShippingOrder,
  assignCourier,
  schedulePickup,
  generateLabel,
  generateManifest,
  cancelShipment,
  getPickupLocations,
  generateInvoice,
  addPickupLocation,
} from '../controllers/shippingOrderController.js';
import { trackOrder, getShippingDashboard } from '../controllers/shippingTrackingController.js';
import {
  getNdrList,
  getNdrDetails,
  reattemptDelivery,
  initiateRTO,
} from '../controllers/shippingNdrController.js';

const router = express.Router();

// All routes require admin auth
router.use(protect, admin);

// Dashboard
router.get('/dashboard', getShippingDashboard);

// Courier serviceability / rate check
router.get('/serviceability', checkServiceability);

// Order lifecycle
router.post('/orders/:orderId/create', createShippingOrder);
router.post('/orders/:orderId/assign-courier', assignCourier);
router.post('/orders/:orderId/pickup', schedulePickup);
router.get('/orders/:orderId/label', generateLabel);
router.post('/orders/:orderId/manifest', generateManifest);
router.post('/orders/:orderId/cancel-shipment', cancelShipment);
router.post('/orders/:orderId/invoice', generateInvoice);

// Tracking
router.get('/orders/:orderId/track', trackOrder);

// NDR management
router.get('/ndr', getNdrList);
router.get('/ndr/:orderId', getNdrDetails);
router.post('/ndr/:orderId/reattempt', reattemptDelivery);
router.post('/ndr/:orderId/rto', initiateRTO);

// Pickup locations
router.get('/pickup-locations', getPickupLocations);
router.post('/pickup-locations', addPickupLocation);

export default router;
