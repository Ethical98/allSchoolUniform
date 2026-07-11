import asyncHandler from 'express-async-handler';
import Order from '../../../models/OrderModel.js';
import { shippingApi } from '../utils/shippingClient.js';

// @desc    Get all NDR shipments
// @route   GET /api/shipping/ndr
// @access  Admin
export const getNdrList = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;

  const filter = { 'shipping.ndr.isNDR': true };

  // Optional filters
  if (req.query.courier) {
    filter['shipping.courierName'] = { $regex: req.query.courier, $options: 'i' };
  }

  const count = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .select('orderId name phone shippingAddress shipping totalPrice paymentMethod')
    .sort({ 'shipping.ndr.lastNdrAt': -1 })
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .lean();

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Get NDR details for a specific order
// @route   GET /api/shipping/ndr/:orderId
// @access  Admin
export const getNdrDetails = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .select('orderId name phone shippingAddress shipping totalPrice paymentMethod')
    .lean();

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Also fetch fresh NDR info from provider if AWB exists
  let providerNdr = null;
  if (order.shipping?.awbCode) {
    try {
      providerNdr = await shippingApi('get', `/ndr/${order.shipping.awbCode}`, {
        action: 'NDR_LIST',
        orderId: order._id,
        asuOrderId: order.orderId,
      });
    } catch (err) {
      // Non-critical, continue with local data
      console.error('[NDR] Provider fetch failed:', err.message);
    }
  }

  res.json({
    order,
    providerNdr,
  });
});

// @desc    Reattempt delivery for NDR order
// @route   POST /api/shipping/ndr/:orderId/reattempt
// @access  Admin
export const reattemptDelivery = asyncHandler(async (req, res) => {
  const { newAddress, newPhone, preferredDate, remarks } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.shipping?.awbCode) {
    res.status(400);
    throw new Error('No AWB code for this order');
  }

  const reattemptPayload = {
    awb: order.shipping.awbCode,
  };

  if (newAddress) reattemptPayload.address = newAddress;
  if (newPhone) reattemptPayload.phone = newPhone;
  if (preferredDate) reattemptPayload.deferred_date = preferredDate;
  if (remarks) reattemptPayload.remarks = remarks;

  await shippingApi('post', '/ndr/reattempt', {
    data: reattemptPayload,
    action: 'NDR_REATTEMPT',
    orderId: order._id,
    asuOrderId: order.orderId,
  });

  // Log the action
  if (!order.shipping.ndr) {
    order.shipping.ndr = { isNDR: true, ndrCount: 0, ndrActions: [] };
  }

  order.shipping.ndr.ndrActions.push({
    action: 'reattempt',
    reason: remarks || 'Admin reattempt',
    newAddress,
    newPhone,
    preferredDate: preferredDate ? new Date(preferredDate) : undefined,
    actionBy: req.user._id,
    actionAt: new Date(),
  });

  order.shipping.syncedAt = new Date();
  await order.save();

  res.json({ message: 'Delivery reattempt requested successfully' });
});

// @desc    Initiate RTO for NDR order
// @route   POST /api/shipping/ndr/:orderId/rto
// @access  Admin
export const initiateRTO = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.shipping?.awbCode) {
    res.status(400);
    throw new Error('No AWB code for this order');
  }

  // ShipRocket doesn't have a direct RTO API — RTO is handled via NDR action
  // We mark it locally and the webhook will handle the rest
  if (!order.shipping.ndr) {
    order.shipping.ndr = { isNDR: true, ndrCount: 0, ndrActions: [] };
  }

  order.shipping.ndr.ndrActions.push({
    action: 'rto',
    reason: req.body.reason || 'Admin initiated RTO',
    actionBy: req.user._id,
    actionAt: new Date(),
  });

  order.shipping.isRTO = true;
  order.shipping.rtoInitiatedAt = new Date();
  order.shipping.status = 'RTO_INITIATED';
  order.shipping.syncedAt = new Date();

  await order.save();

  res.json({ message: 'RTO initiated' });
});
