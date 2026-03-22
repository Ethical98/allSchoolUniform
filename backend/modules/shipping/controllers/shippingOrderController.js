import asyncHandler from 'express-async-handler';
import Order from '../../../models/OrderModel.js';
import User from '../../../models/UserModel.js';
import { shippingApi } from '../utils/shippingClient.js';
import { mapOrderToProvider } from '../utils/shippingMapper.js';

// @desc    Check courier serviceability and rates
// @route   GET /api/shipping/serviceability
// @access  Admin
export const checkServiceability = asyncHandler(async (req, res) => {
  const { pickup_postcode, delivery_postcode, weight, cod } = req.query;

  if (!pickup_postcode || !delivery_postcode || !weight) {
    res.status(400);
    throw new Error('pickup_postcode, delivery_postcode, and weight are required');
  }

  const data = await shippingApi('get', '/courier/serviceability/', {
    params: {
      pickup_postcode,
      delivery_postcode,
      weight: Number(weight),
      cod: cod === '1' || cod === 'true' ? 1 : 0,
    },
    action: 'SERVICEABILITY',
  });

  res.json(data);
});

// @desc    Create order on shipping provider
// @route   POST /api/shipping/orders/:orderId/create
// @access  Admin
export const createShippingOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.shipping?.isShipped) {
    res.status(400);
    throw new Error('Order already pushed to shipping provider');
  }

  // Save weight and dimensions from admin input
  if (req.body.weight || req.body.dimensions) {
    if (!order.shipping) order.shipping = {};
    if (req.body.weight) order.shipping.weight = req.body.weight;
    if (req.body.dimensions) order.shipping.dimensions = req.body.dimensions;
    await order.save();
  }

  const user = await User.findById(order.user);
  const payload = mapOrderToProvider(order, user);

  const data = await shippingApi('post', '/orders/create/adhoc', {
    data: payload,
    action: 'CREATE_ORDER',
    orderId: order._id,
    asuOrderId: order.orderId,
  });

  // Update order with provider response
  order.shipping = {
    ...order.shipping?.toObject?.() || {},
    provider: 'shiprocket',
    providerOrderId: data.order_id,
    providerShipmentId: data.shipment_id,
    isShipped: true,
    status: 'NEW',
    syncedAt: new Date(),
  };

  await order.save();

  res.status(201).json({
    message: 'Order created on shipping provider',
    providerOrderId: data.order_id,
    providerShipmentId: data.shipment_id,
  });
});

// @desc    Assign courier and generate AWB
// @route   POST /api/shipping/orders/:orderId/assign-courier
// @access  Admin
export const assignCourier = asyncHandler(async (req, res) => {
  const { courierId } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.shipping?.providerShipmentId) {
    res.status(400);
    throw new Error('Order not yet created on shipping provider');
  }

  if (order.shipping?.awbCode) {
    res.status(400);
    throw new Error('Courier already assigned to this order');
  }

  const data = await shippingApi('post', '/courier/assign/awb', {
    data: {
      shipment_id: order.shipping.providerShipmentId,
      courier_id: courierId,
    },
    action: 'ASSIGN_AWB',
    orderId: order._id,
    asuOrderId: order.orderId,
  });

  const awbData = data.response?.data;
  order.shipping.awbCode = awbData?.awb_code || data.awb_code;
  order.shipping.courierName = awbData?.courier_name || data.courier_name;
  order.shipping.courierId = courierId;
  order.shipping.status = 'AWB_ASSIGNED';
  order.shipping.syncedAt = new Date();

  await order.save();

  res.json({
    message: 'Courier assigned successfully',
    awbCode: order.shipping.awbCode,
    courierName: order.shipping.courierName,
  });
});

// @desc    Schedule pickup
// @route   POST /api/shipping/orders/:orderId/pickup
// @access  Admin
export const schedulePickup = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.shipping?.providerShipmentId) {
    res.status(400);
    throw new Error('Order not yet created on shipping provider');
  }

  const data = await shippingApi('post', '/courier/generate/pickup', {
    data: {
      shipment_id: [order.shipping.providerShipmentId],
    },
    action: 'SCHEDULE_PICKUP',
    orderId: order._id,
    asuOrderId: order.orderId,
  });

  order.shipping.pickupScheduledDate = new Date();
  order.shipping.pickupTokenNumber = data.pickup_token_number || data.response?.pickup_token_number;
  order.shipping.status = 'PICKUP_SCHEDULED';
  order.shipping.syncedAt = new Date();

  await order.save();

  res.json({
    message: 'Pickup scheduled successfully',
    pickupTokenNumber: order.shipping.pickupTokenNumber,
  });
});

// @desc    Generate shipping label
// @route   GET /api/shipping/orders/:orderId/label
// @access  Admin
export const generateLabel = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.shipping?.providerShipmentId) {
    res.status(400);
    throw new Error('Order not yet created on shipping provider');
  }

  const data = await shippingApi('post', '/courier/generate/label', {
    data: {
      shipment_id: [order.shipping.providerShipmentId],
    },
    action: 'GENERATE_LABEL',
    orderId: order._id,
    asuOrderId: order.orderId,
  });

  order.shipping.labelUrl = data.label_url || data.response;
  order.shipping.syncedAt = new Date();
  await order.save();

  res.json({
    message: 'Label generated',
    labelUrl: order.shipping.labelUrl,
  });
});

// @desc    Generate manifest
// @route   POST /api/shipping/orders/:orderId/manifest
// @access  Admin
export const generateManifest = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.shipping?.providerShipmentId) {
    res.status(400);
    throw new Error('Order not yet created on shipping provider');
  }

  const data = await shippingApi('post', '/manifests/generate', {
    data: {
      shipment_id: [order.shipping.providerShipmentId],
    },
    action: 'GENERATE_MANIFEST',
    orderId: order._id,
    asuOrderId: order.orderId,
  });

  order.shipping.manifestUrl = data.manifest_url || data.response;
  order.shipping.syncedAt = new Date();
  await order.save();

  res.json({
    message: 'Manifest generated',
    manifestUrl: order.shipping.manifestUrl,
  });
});

// @desc    Cancel shipment on provider
// @route   POST /api/shipping/orders/:orderId/cancel-shipment
// @access  Admin
export const cancelShipment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.shipping?.isShipped) {
    res.status(400);
    throw new Error('Order not on shipping provider');
  }

  try {
    await shippingApi('post', '/orders/cancel', {
      data: {
        ids: [order.shipping.providerOrderId],
      },
      action: 'CANCEL_ORDER',
      orderId: order._id,
      asuOrderId: order.orderId,
    });
  } catch (error) {
    // Log the error but don't block — admin can handle manually
    order.shipping.errors.push({
      action: 'CANCEL_ORDER',
      message: error.message,
    });
    await order.save();

    res.status(200).json({
      message: 'Cancellation request failed on provider, flagged for manual review',
      error: error.message,
      manualReviewRequired: true,
    });
    return;
  }

  // Clear shipping state
  order.shipping.status = 'CANCELLED';
  order.shipping.syncedAt = new Date();

  await order.save();

  res.json({
    message: 'Shipment cancelled on provider',
  });
});

// @desc    Get pickup locations
// @route   GET /api/shipping/pickup-locations
// @access  Admin
export const getPickupLocations = asyncHandler(async (req, res) => {
  const data = await shippingApi('get', '/settings/company/pickup', {
    action: 'PICKUP_LOCATIONS',
  });

  res.json(data);
});
