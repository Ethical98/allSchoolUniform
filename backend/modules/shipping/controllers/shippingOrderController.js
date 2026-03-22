import asyncHandler from 'express-async-handler';
import Order from '../../../models/OrderModel.js';
import User from '../../../models/UserModel.js';
import { shippingApi } from '../utils/shippingClient.js';
import { mapOrderToProvider } from '../utils/shippingMapper.js';
import { redis } from '../../../services/redisService.js';

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
  if (!order.shipping) order.shipping = {};
  if (req.body.weight) order.shipping.weight = req.body.weight;
  if (req.body.dimensions) order.shipping.dimensions = req.body.dimensions;
  if (req.body.pickupLocation) order.shipping.pickupLocation = req.body.pickupLocation;

  // Track ship attempts for re-shipping cancelled orders (ShipRocket needs unique order_id)
  const wasCancelled = order.shipping.status === 'CANCELLED';
  const shipAttempt = (order.shipping.shipAttempt || 0) + 1;
  order.shipping.shipAttempt = shipAttempt;
  await order.save();

  const user = await User.findById(order.user);
  const payload = mapOrderToProvider(order, user, req.body.pickupLocation);

  // Append retry suffix for re-shipped orders so ShipRocket gets a unique order_id
  if (shipAttempt > 1 || wasCancelled) {
    payload.order_id = `${order.orderId}-R${shipAttempt}`;
  }

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

  const response = {
    message: 'Order created on shipping provider',
    providerOrderId: data.order_id,
    providerShipmentId: data.shipment_id,
  };

  // Single-step flow: if courierId provided, assign courier immediately
  if (req.body.courierId) {
    try {
      const awbResponse = await shippingApi('post', '/courier/assign/awb', {
        data: {
          shipment_id: data.shipment_id,
          courier_id: req.body.courierId,
        },
        action: 'ASSIGN_AWB',
        orderId: order._id,
        asuOrderId: order.orderId,
      });

      const awbData = awbResponse.response?.data;
      order.shipping.awbCode = awbData?.awb_code || awbResponse.awb_code;
      order.shipping.courierName = awbData?.courier_name || awbResponse.courier_name || req.body.courierName || 'Assigned';
      order.shipping.courierId = req.body.courierId;
      order.shipping.status = 'AWB_ASSIGNED';
      if (req.body.courierCharges) order.shipping.courierCharges = req.body.courierCharges;
      if (req.body.estimatedDeliveryDate) order.shipping.estimatedDeliveryDate = new Date(req.body.estimatedDeliveryDate);
      order.shipping.syncedAt = new Date();

      await order.save();

      response.awbCode = order.shipping.awbCode;
      response.courierName = order.shipping.courierName;
      response.message = 'Order created and courier assigned';
    } catch (awbError) {
      // Order was created but AWB assignment failed — don't throw, let admin retry
      response.message = 'Order created but courier assignment failed. You can assign courier manually.';
      response.awbError = awbError.message;
    }
  }

  res.status(201).json(response);
});

// @desc    Assign courier and generate AWB
// @route   POST /api/shipping/orders/:orderId/assign-courier
// @access  Admin
export const assignCourier = asyncHandler(async (req, res) => {
  const { courierId, courierCharges, estimatedDeliveryDate, courierName: reqCourierName } = req.body;
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
  order.shipping.courierName = awbData?.courier_name || data.courier_name || reqCourierName || 'Assigned';
  order.shipping.courierId = courierId;
  if (courierCharges) order.shipping.courierCharges = courierCharges;
  if (estimatedDeliveryDate) order.shipping.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
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

  order.shipping.labelUrl = data.label_url || null;
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

  order.shipping.manifestUrl = data.manifest_url || data.url || null;
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
    if (!order.shipping.errors) order.shipping.errors = [];
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

  // Reset shipping state so order can be re-shipped
  order.shipping.status = 'CANCELLED';
  order.shipping.isShipped = false;
  order.shipping.providerOrderId = undefined;
  order.shipping.providerShipmentId = undefined;
  order.shipping.awbCode = undefined;
  order.shipping.courierName = undefined;
  order.shipping.courierId = undefined;
  order.shipping.courierCharges = undefined;
  order.shipping.estimatedDeliveryDate = undefined;
  order.shipping.pickupLocation = undefined;
  order.shipping.pickupScheduledDate = undefined;
  order.shipping.pickupTokenNumber = undefined;
  order.shipping.labelUrl = undefined;
  order.shipping.manifestUrl = undefined;
  order.shipping.invoiceUrl = undefined;
  order.shipping.syncedAt = new Date();

  await order.save();

  res.json({
    message: 'Shipment cancelled on provider',
  });
});

// @desc    Get pickup locations (cached in Redis for 1 hour)
// @route   GET /api/shipping/pickup-locations
// @access  Admin
export const getPickupLocations = asyncHandler(async (req, res) => {
  const CACHE_KEY = 'shipping:pickup-locations';
  const CACHE_TTL = 3600; // 1 hour

  // Check Redis cache first
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  } catch (err) {
    console.error('[Pickup Locations] Redis read failed:', err.message);
  }

  const data = await shippingApi('get', '/settings/company/pickup', {
    action: 'PICKUP_LOCATIONS',
  });

  // Cache the result
  try {
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(data));
  } catch (err) {
    console.error('[Pickup Locations] Redis write failed:', err.message);
  }

  res.json(data);
});

// @desc    Generate shipping invoice
// @route   GET /api/shipping/orders/:orderId/invoice
// @access  Admin
export const generateInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.shipping?.providerOrderId) {
    res.status(400);
    throw new Error('Order not yet created on shipping provider');
  }

  const data = await shippingApi('post', '/orders/print/invoice', {
    data: {
      ids: [order.shipping.providerOrderId],
    },
    action: 'GENERATE_INVOICE',
    orderId: order._id,
    asuOrderId: order.orderId,
  });

  if (!data.is_invoice_created && !data.invoice_url) {
    res.status(400);
    throw new Error(`Invoice generation failed: ${JSON.stringify(data.not_created || data)}`);
  }

  order.shipping.invoiceUrl = data.invoice_url || null;
  order.shipping.syncedAt = new Date();
  await order.save();

  res.json({
    message: 'Invoice generated',
    invoiceUrl: order.shipping.invoiceUrl,
  });
});

// @desc    Add a new pickup location
// @route   POST /api/shipping/pickup-locations
// @access  Admin
export const addPickupLocation = asyncHandler(async (req, res) => {
  const { pickup_location, name, email, phone, address, city, state, pin_code, country } = req.body;

  if (!pickup_location || !phone || !address || !city || !state || !pin_code) {
    res.status(400);
    throw new Error('pickup_location, phone, address, city, state, and pin_code are required');
  }

  const data = await shippingApi('post', '/settings/company/addpickup', {
    data: {
      pickup_location,
      name: name || pickup_location,
      email: email || '',
      phone,
      address,
      city,
      state,
      pin_code,
      country: country || 'India',
    },
    action: 'ADD_PICKUP_LOCATION',
  });

  // Invalidate pickup locations cache
  try {
    await redis.del('shipping:pickup-locations');
  } catch (err) {
    console.error('[Add Pickup] Redis cache invalidation failed:', err.message);
  }

  res.status(201).json({
    message: 'Pickup location added successfully',
    data,
  });
});
