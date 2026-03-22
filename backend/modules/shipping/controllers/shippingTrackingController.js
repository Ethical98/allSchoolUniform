import asyncHandler from 'express-async-handler';
import Order from '../../../models/OrderModel.js';
import { shippingApi } from '../utils/shippingClient.js';

// @desc    Get live tracking for an order
// @route   GET /api/shipping/orders/:orderId/track
// @access  Admin
export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.shipping?.awbCode) {
    res.status(400);
    throw new Error('No AWB code assigned to this order');
  }

  const data = await shippingApi('get', `/courier/track/awb/${order.shipping.awbCode}`, {
    action: 'TRACK',
    orderId: order._id,
    asuOrderId: order.orderId,
  });

  // Update tracking history on the order
  const trackingData = data.tracking_data;
  if (trackingData) {
    const shipmentTrack = trackingData.shipment_track || [];
    const trackActivities = trackingData.shipment_track_activities || [];

    // Update tracking history from activities
    if (trackActivities.length > 0) {
      order.shipping.trackingHistory = trackActivities.map((activity) => ({
        status: activity['sr-status'] || activity.activity,
        statusCode: activity['sr-status-code'],
        location: activity.location,
        timestamp: new Date(activity.date),
        remarks: activity.activity,
      }));
    }

    // Update current status from track
    if (shipmentTrack.length > 0) {
      const latest = shipmentTrack[0];
      order.shipping.status = latest.current_status;
      order.shipping.estimatedDeliveryDate = latest.edd
        ? new Date(latest.edd)
        : order.shipping.estimatedDeliveryDate;
    }

    order.shipping.syncedAt = new Date();
    await order.save();
  }

  res.json({
    orderId: order.orderId,
    awbCode: order.shipping.awbCode,
    courierName: order.shipping.courierName,
    currentStatus: order.shipping.status,
    estimatedDeliveryDate: order.shipping.estimatedDeliveryDate,
    trackingHistory: order.shipping.trackingHistory,
    rawData: trackingData,
  });
});

// @desc    Get shipping dashboard summary
// @route   GET /api/shipping/dashboard
// @access  Admin
export const getShippingDashboard = asyncHandler(async (req, res) => {
  const [
    totalShipped,
    inTransit,
    delivered,
    ndrActive,
    rtoCount,
    stuckShipments,
  ] = await Promise.all([
    Order.countDocuments({ 'shipping.isShipped': true }),
    Order.countDocuments({
      'shipping.isShipped': true,
      'shipping.status': { $in: ['SHIPPED', 'IN TRANSIT', 'OUT FOR DELIVERY', 'AWB_ASSIGNED', 'PICKUP_SCHEDULED'] },
      'tracking.isDelivered': false,
      'tracking.isCanceled': false,
      'shipping.isRTO': false,
    }),
    Order.countDocuments({
      'shipping.isShipped': true,
      'tracking.isDelivered': true,
    }),
    Order.countDocuments({ 'shipping.ndr.isNDR': true }),
    Order.countDocuments({ 'shipping.isRTO': true }),
    // Stuck: shipped, not delivered, no sync in 48 hours
    Order.countDocuments({
      'shipping.isShipped': true,
      'tracking.isDelivered': false,
      'tracking.isCanceled': false,
      'shipping.isRTO': false,
      'shipping.ndr.isNDR': false,
      'shipping.syncedAt': { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    }),
  ]);

  // Get recent active shipments
  const activeShipments = await Order.find({
    'shipping.isShipped': true,
    'tracking.isDelivered': false,
    'tracking.isCanceled': false,
  })
    .select('orderId name shipping.awbCode shipping.courierName shipping.status shipping.estimatedDeliveryDate shipping.syncedAt shipping.ndr shipping.isRTO')
    .sort({ 'shipping.syncedAt': -1 })
    .limit(50)
    .lean();

  // Get NDR alerts
  const ndrAlerts = await Order.find({
    'shipping.ndr.isNDR': true,
  })
    .select('orderId name shipping.awbCode shipping.courierName shipping.ndr phone shippingAddress')
    .sort({ 'shipping.ndr.lastNdrAt': -1 })
    .limit(20)
    .lean();

  // Get stuck shipments
  const stuckList = await Order.find({
    'shipping.isShipped': true,
    'tracking.isDelivered': false,
    'tracking.isCanceled': false,
    'shipping.isRTO': false,
    'shipping.ndr.isNDR': false,
    'shipping.syncedAt': { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
  })
    .select('orderId name shipping.awbCode shipping.courierName shipping.status shipping.syncedAt')
    .sort({ 'shipping.syncedAt': 1 })
    .limit(20)
    .lean();

  res.json({
    summary: {
      totalShipped,
      inTransit,
      delivered,
      ndrActive,
      rtoCount,
      stuckShipments,
    },
    activeShipments,
    ndrAlerts,
    stuckList,
  });
});
