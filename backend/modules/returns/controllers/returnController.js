import asyncHandler from 'express-async-handler';
import ReturnRequest from '../models/ReturnRequestModel.js';
import Order from '../../../models/OrderModel.js';
import User from '../../../models/UserModel.js';
import Product from '../../../models/ProductModel.js';
import { updateInventoryBucket } from '../../stock/utils/inventoryCalc.js';
import { validateTransition, getNextStatuses } from '../utils/returnStateMachine.js';
import {
  validateOrderEligibility,
  validateReturnWindow,
  checkOverReturn,
  validateQCCompleteness,
  validateRefundTotal,
  getReturnEligibility,
} from '../utils/returnValidation.js';
import {
  computeItemRefund,
  computeReturnRefund,
  resolveOrderItems,
} from '../pricing/returnPricing.js';
import { canInitiateRefund } from '../state/transitionGuards.js';
import { recomputeOrderReturnFlag } from '../utils/orderReturnFlag.js';
import { processQCDispositions } from '../utils/returnStockHandler.js';
import { generateReturnCreditNote } from '../utils/returnCreditNoteHelper.js';
import { mapReturnToShiprocketPayload } from '../utils/returnShippingMapper.js';
import { sendReturnEmail } from '../utils/returnEmailHelper.js';
import { validateRefundDestination } from '../utils/refundDestination.js';
import { shippingApi } from '../../shipping/utils/shippingClient.js';
import { acquireLock, releaseLock } from '../../../services/redisService.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new return/exchange/replacement request
// @route   POST /api/returns
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const createReturnRequest = asyncHandler(async (req, res) => {
  const {
    orderId,
    type,
    reason,
    reasonDetails,
    items,
    pickupAddress,
    overrideReturnWindow,
    refundMethod,
    refundUpiId,
    refundBankDetails,
  } = req.body;

  // Validate input
  if (!orderId || !type || !reason || !items || items.length === 0) {
    res.status(400);
    throw new Error('orderId, type, reason, and items are required');
  }

  // Acquire distributed lock to prevent concurrent returns on same order
  const lockKey = `return:lock:${orderId}`;
  const lockAcquired = await acquireLock(lockKey, 30);
  if (!lockAcquired) {
    res.status(409);
    throw new Error('Another return is being created for this order. Please try again.');
  }

  try {
    const order = await Order.findById(orderId);

    // Validate order eligibility
    validateOrderEligibility(order);

    // COD returns must carry a valid refund destination (no original payment to reverse).
    const refundDest = validateRefundDestination({
      paymentMethod: order.paymentMethod,
      refundMethod,
      refundUpiId,
      refundBankDetails,
    });
    if (!refundDest.ok) {
      res.status(400);
      throw new Error(refundDest.error);
    }

    // Validate 7-day return window
    const windowInfo = validateReturnWindow(order, overrideReturnWindow);

    // M3: resolve against modifiedItems when the order was modified post-purchase.
    const sourceItems = resolveOrderItems(order);

    // Validate over-return against the same item list used for pricing
    await checkOverReturn(orderId, items, sourceItems);

    // Fetch user for denormalization
    const user = await User.findById(order.user);

    // Build return items from order items
    const returnItems = items.map((reqItem) => {
      const orderItem = sourceItems.find(
        (oi) =>
          oi.product.toString() === reqItem.product.toString() &&
          oi.size === reqItem.size
      );

      return {
        product: orderItem.product,
        productName: orderItem.name,
        SKU: orderItem.productCode || '',
        size: orderItem.size,
        image: orderItem.image,
        originalQty: orderItem.qty,
        returnQty: reqItem.returnQty,
        price: orderItem.price,
        disc: orderItem.disc || 0,
        tax: orderItem.tax || 0,
        refundAmount: computeItemRefund(orderItem, reqItem.returnQty),
        // Exchange fields (only for EXCHANGE type)
        ...(type === 'EXCHANGE' && reqItem.exchangeProduct
          ? {
              exchangeProduct: reqItem.exchangeProduct,
              exchangeProductName: reqItem.exchangeProductName,
              exchangeSize: reqItem.exchangeSize,
              exchangeUnitPrice: reqItem.exchangeUnitPrice,
            }
          : {}),
      };
    });

    // Backfill SKU from the product's canonical SKU when the order item's
    // productCode is blank — keeps the denormalized return-item SKU valid so
    // downstream StockMovement creation (QC) never fails on a required SKU.
    for (const ri of returnItems) {
      if (!ri.SKU) {
        const prod = await Product.findById(ri.product).select('SKU');
        if (prod?.SKU) ri.SKU = prod.SKU;
      }
    }

    // Calculate totals
    const totalRefundAmount = returnItems.reduce(
      (sum, item) => sum + item.refundAmount,
      0
    );

    // Calculate price difference for exchanges
    // Uses actual discounted price from product DB, not raw MRP from frontend
    let priceDifference = 0;
    if (type === 'EXCHANGE') {
      let exchangeTotal = 0;
      for (const item of returnItems) {
        if (item.exchangeProduct) {
          const exProduct = await Product.findById(item.exchangeProduct);
          const exVariant = exProduct?.size?.find(
            (s) => s.size === item.exchangeSize
          );
          const exPrice = exVariant?.price || item.exchangeUnitPrice || 0;
          const exDisc = exVariant?.discount || 0;
          const exDiscountedPrice = exPrice * (1 - exDisc / 100);
          exchangeTotal += exDiscountedPrice * item.returnQty;

          // Store the actual MRP on the return item (for exchange order creation later)
          item.exchangeUnitPrice = exPrice;
        }
      }
      priceDifference = Number(
        (exchangeTotal - totalRefundAmount).toFixed(2)
      );
    }

    // Build pickup address (default from order shipping address)
    const resolvedPickupAddress = pickupAddress
      ? {
          address: pickupAddress.address || order.shippingAddress?.address,
          city: pickupAddress.city || order.shippingAddress?.city,
          state: pickupAddress.state || order.shippingAddress?.state,
          postalCode: pickupAddress.postalCode || order.shippingAddress?.postalCode,
          country: pickupAddress.country || order.shippingAddress?.country || 'India',
          phone: pickupAddress.phone || order.phone || '',
        }
      : {
          address: order.shippingAddress?.address,
          city: order.shippingAddress?.city,
          state: order.shippingAddress?.state,
          postalCode: order.shippingAddress?.postalCode,
          country: order.shippingAddress?.country || 'India',
          phone: order.phone || '',
        };

    // Build timeline entry
    const timelineEntry = {
      action: 'CREATED',
      toStatus: 'INITIATED',
      note: `${type} request created. Reason: ${reason}${overrideReturnWindow ? ' (Return window overridden by admin)' : ''}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
    };

    // Create the return request
    const returnRequest = await ReturnRequest.create({
      type,
      status: 'INITIATED',
      order: order._id,
      orderId: order.orderId,
      invoiceNumber: order.invoiceNumber || '',
      customer: order.user,
      customerName: user?.name || order.name,
      customerEmail: user?.email || '',
      customerPhone: order.phone || user?.phone || '',
      items: returnItems,
      reason,
      reasonDetails,
      pickupAddress: resolvedPickupAddress,
      refundAmount: Number(totalRefundAmount.toFixed(2)),
      // Shipping is never refunded on returns.
      shippingRefundAmount: 0,
      priceDifference,
      billType: order.billType || 'CGST',
      overrideReturnWindow: overrideReturnWindow || false,
      ...refundDest.normalized,
      timeline: [timelineEntry],
      createdBy: req.user._id,
      createdByName: req.user.name,
    });

    // Mark order as having returns
    order.hasReturns = true;
    await order.save();

    // Send email (non-blocking)
    sendReturnEmail(returnRequest, 'INITIATED').catch((err) => {
      console.error('Return initiated email failed (non-blocking):', err.message);
    });

    res.status(201).json({
      returnRequest,
      returnWindowExpiresAt: windowInfo.returnWindowExpiresAt,
      daysRemaining: windowInfo.daysRemaining,
    });
  } finally {
    await releaseLock(lockKey);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all return requests (paginated, filterable)
// @route   GET /api/returns
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getReturnRequests = asyncHandler(async (req, res) => {
  const pageSize = 20;
  const page = Number(req.query.page) || 1;

  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.keyword) {
    filter.$or = [
      { returnId: { $regex: req.query.keyword, $options: 'i' } },
      { orderId: { $regex: req.query.keyword, $options: 'i' } },
      { customerName: { $regex: req.query.keyword, $options: 'i' } },
    ];
  }
  if (req.query.fromDate || req.query.toDate) {
    filter.createdAt = {};
    if (req.query.fromDate) filter.createdAt.$gte = new Date(req.query.fromDate);
    if (req.query.toDate) filter.createdAt.$lte = new Date(req.query.toDate);
  }

  const count = await ReturnRequest.countDocuments(filter);
  const returns = await ReturnRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .lean();

  res.json({
    returns,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get returns dashboard stats
// @route   GET /api/returns/dashboard
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getReturnsDashboard = asyncHandler(async (req, res) => {
  const [total, pendingApproval, pendingQC, pendingRefund, exchanges] =
    await Promise.all([
      ReturnRequest.countDocuments({}),
      ReturnRequest.countDocuments({ status: 'INITIATED' }),
      ReturnRequest.countDocuments({
        status: { $in: ['RECEIVED', 'QC_IN_PROGRESS'] },
      }),
      ReturnRequest.countDocuments({ status: 'REFUND_INITIATED' }),
      ReturnRequest.countDocuments({
        type: 'EXCHANGE',
        status: { $nin: ['COMPLETED', 'REJECTED', 'CANCELLED'] },
      }),
    ]);

  res.json({ total, pendingApproval, pendingQC, pendingRefund, exchanges });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all returns for a specific order
// @route   GET /api/returns/order/:orderId
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getReturnsByOrder = asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({ order: req.params.orderId })
    .sort({ createdAt: -1 })
    .lean();

  res.json(returns);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single return request by ID
// @route   GET /api/returns/:id
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getReturnRequestById = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);

  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  // Include available next statuses for the UI
  const nextStatuses = getNextStatuses(
    returnRequest.status,
    returnRequest.type
  );

  res.json({ returnRequest, nextStatuses });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update return status (state machine enforced)
// @route   PATCH /api/returns/:id/status
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  // Validate transition
  validateTransition(returnRequest.status, status, returnRequest.type);

  const previousStatus = returnRequest.status;

  // ── Status-specific side effects ─────────────────────────────────────
  switch (status) {
    case 'PICKUP_SCHEDULED': {
      // Create return order on Shiprocket
      const user = await User.findById(returnRequest.customer);
      const originalOrder = await Order.findById(returnRequest.order);

      // Fetch warehouse address from ShipRocket (same source as order-detail UI)
      // Shiprocket response: { data: { shipping_address: [...] } }
      let warehouseLocation = null;
      try {
        const locData = await shippingApi('get', '/settings/company/pickup', {
          action: 'PICKUP_LOCATIONS',
          orderId: returnRequest.order,
          asuOrderId: returnRequest.orderId,
        });
        const locations = locData?.data?.shipping_address || locData?.shipping_address || [];
        if (!Array.isArray(locations)) {
          console.warn('[ReturnPickup] Unexpected pickup locations shape:', JSON.stringify(locData)?.slice(0, 200));
        } else {
          const targetName = process.env.SHIPPING_PICKUP_LOCATION || '';
          warehouseLocation = (targetName
            ? locations.find((l) => l.pickup_location?.toLowerCase() === targetName.toLowerCase())
            : null) || locations[0] || null;
        }
      } catch (e) {
        console.warn('[ReturnPickup] Could not fetch pickup locations:', e.message);
      }

      // Ensure we have a warehouse address before calling Shiprocket
      const resolvedWarehouseAddress =
        warehouseLocation?.address || process.env.WAREHOUSE_ADDRESS || '';
      if (!resolvedWarehouseAddress) {
        throw new Error(
          'Warehouse address is not configured. Set WAREHOUSE_ADDRESS in .env or add a pickup location named "' +
          (process.env.SHIPPING_PICKUP_LOCATION || 'ALLSCHOOLUNIFORM.COM') +
          '" in Shiprocket settings.'
        );
      }

      const payload = mapReturnToShiprocketPayload(
        returnRequest,
        originalOrder,
        user,
        warehouseLocation
      );

      // Override weight/dimensions from admin input
      if (req.body.weight) payload.weight = req.body.weight;
      if (req.body.dimensions) {
        payload.length = req.body.dimensions.length || payload.length;
        payload.breadth = req.body.dimensions.breadth || payload.breadth;
        payload.height = req.body.dimensions.height || payload.height;
      }

      const srData = await shippingApi('post', '/orders/create/return', {
        data: payload,
        action: 'CREATE_RETURN_ORDER',
        orderId: returnRequest.order,
        asuOrderId: returnRequest.orderId,
      });

      returnRequest.reverseShipping = {
        ...returnRequest.reverseShipping?.toObject?.() || {},
        provider: 'shiprocket',
        providerOrderId: srData.order_id,
        providerShipmentId: srData.shipment_id,
        awbCode: srData.awb_code || '',
        courierName: srData.courier_name || '',
        pickupScheduledDate: new Date(),
      };
      break;
    }

    case 'RECEIVED':
      returnRequest.reverseShipping = {
        ...returnRequest.reverseShipping?.toObject?.() || {},
        receivedAt: new Date(),
      };
      break;

    case 'QC_COMPLETED': {
      // Validate all items have QC disposition set
      validateQCCompleteness(returnRequest.items);

      // Process stock movements
      const qcResults = await processQCDispositions(returnRequest, req.user);

      // Add QC summary to timeline note
      const qcSummary = qcResults.results
        .map((r) => `${r.size}: ${r.disposition} (${r.action})`)
        .join(', ');
      returnRequest.timeline.push({
        action: 'QC_RESULTS',
        note: `QC completed: ${qcSummary}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
      });
      break;
    }

    case 'REFUND_INITIATED': {
      // H4: block cash refund when a live exchange/replacement order exists.
      const linkedExchange = returnRequest.exchangeOrderId
        ? await Order.findById(returnRequest.exchangeOrderId)
        : null;
      const refundGuard = canInitiateRefund(returnRequest, linkedExchange);
      if (!refundGuard.ok) {
        res.status(400);
        throw new Error(refundGuard.reason);
      }

      // All refund effects post exactly once. Re-entry is a no-op so the stored
      // refundAmount can never diverge from what was credited to the order ledger.
      if (!returnRequest.refundLedgerPosted) {
        if (req.body.fullRefundOverride !== undefined) {
          returnRequest.fullRefundOverride = req.body.fullRefundOverride === true;
        }

        // Effective refund (items only): NOT_RECEIVED & UNSELLABLE contribute 0;
        // DAMAGED & GOOD refund the accepted qty. Shipping is never refunded.
        const { itemsRefund } = computeReturnRefund(returnRequest);
        returnRequest.refundAmount = Number(itemsRefund.toFixed(2));
        returnRequest.refundInitiatedAt = new Date();

        // Auto-generate credit note if not yet created
        if (!returnRequest.creditNote) {
          const creditNote = await generateReturnCreditNote(returnRequest, req.user);
          returnRequest.timeline.push({
            action: 'CREDIT_NOTE_GENERATED',
            note: `Credit note ${creditNote.documentNumber} generated. Effective refund: ₹${returnRequest.refundAmount}`,
            performedBy: req.user._id,
            performedByName: req.user.name,
          });
        }

        // Update order's totalRefundedSoFar — items refund only (shipping is never refunded).
        const order = await Order.findById(returnRequest.order);
        const totalRefund = Number(returnRequest.refundAmount.toFixed(2));
        validateRefundTotal(order, totalRefund);
        order.totalRefundedSoFar = (order.totalRefundedSoFar || 0) + totalRefund;
        await order.save();
        returnRequest.refundLedgerPosted = true;
      }
      break;
    }

    case 'EXCHANGE_SHIPPED': {
      if (!returnRequest.exchangeOrderId) {
        res.status(400);
        throw new Error(
          'Exchange order must be created before marking as shipped'
        );
      }
      if (
        returnRequest.priceDifference > 0 &&
        !returnRequest.priceDifferenceCollected
      ) {
        res.status(400);
        throw new Error(
          `Price difference of ${returnRequest.priceDifference} must be collected before shipping exchange`
        );
      }
      break;
    }

    case 'REPLACEMENT_SHIPPED': {
      if (!returnRequest.exchangeOrderId) {
        res.status(400);
        throw new Error(
          'Replacement order must be created before marking as shipped'
        );
      }
      break;
    }

    case 'COMPLETED':
      break;

    case 'CANCELLED': {
      // Cascade: cancel linked exchange order if not yet shipped
      if (returnRequest.exchangeOrderId) {
        const exchangeOrder = await Order.findById(
          returnRequest.exchangeOrderId
        );
        if (exchangeOrder) {
          if (
            exchangeOrder.tracking?.isOutForDelivery ||
            exchangeOrder.tracking?.isDelivered ||
            exchangeOrder.shipping?.isShipped
          ) {
            res.status(400);
            throw new Error(
              'Cannot cancel return — exchange order is already shipped/delivered'
            );
          }
          exchangeOrder.tracking = {
            ...exchangeOrder.tracking?.toObject?.() || {},
            isCanceled: true,
            canceledAt: new Date(),
          };
          await exchangeOrder.save();

          returnRequest.timeline.push({
            action: 'EXCHANGE_ORDER_CANCELLED',
            note: `Linked exchange order ${exchangeOrder.orderId} cancelled`,
            performedBy: req.user._id,
            performedByName: req.user.name,
          });
        }
      }
      break;
    }
  }

  // Update status
  returnRequest.status = status;

  // Push timeline entry
  returnRequest.timeline.push({
    action: 'STATUS_CHANGE',
    fromStatus: previousStatus,
    toStatus: status,
    note: note || '',
    performedBy: req.user._id,
    performedByName: req.user.name,
  });

  await returnRequest.save();

  // H3: a return ending in a terminal-negative state frees the order to be returned again.
  if (status === 'REJECTED' || status === 'CANCELLED') {
    await recomputeOrderReturnFlag(returnRequest.order);
  }

  // Send email (non-blocking)
  sendReturnEmail(returnRequest, status).catch((err) => {
    console.error(`Return ${status} email failed (non-blocking):`, err.message);
  });

  res.json({
    returnRequest,
    nextStatuses: getNextStatuses(returnRequest.status, returnRequest.type),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update QC dispositions for return items
// @route   PATCH /api/returns/:id/qc
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const updateQCDisposition = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ itemId, disposition, notes }]

  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  if (returnRequest.status !== 'QC_IN_PROGRESS') {
    res.status(400);
    throw new Error(
      `QC can only be updated when status is QC_IN_PROGRESS (current: ${returnRequest.status})`
    );
  }

  const validDispositions = ['GOOD', 'DAMAGED', 'UNSELLABLE', 'NOT_RECEIVED'];

  for (const qcItem of items) {
    if (!validDispositions.includes(qcItem.disposition)) {
      res.status(400);
      throw new Error(
        `Invalid disposition "${qcItem.disposition}". Valid: ${validDispositions.join(', ')}`
      );
    }

    const returnItem = returnRequest.items.id(qcItem.itemId);
    if (!returnItem) {
      res.status(400);
      throw new Error(`Return item with id ${qcItem.itemId} not found`);
    }

    if (qcItem.acceptedQty !== undefined) {
      const aq = Number(qcItem.acceptedQty);
      if (!Number.isInteger(aq) || aq < 0 || aq > returnItem.returnQty) {
        res.status(400);
        throw new Error(
          `Accepted qty for "${returnItem.productName}" (${returnItem.size}) must be an integer between 0 and ${returnItem.returnQty}`
        );
      }
      returnItem.acceptedQty = aq;
    }

    returnItem.qcDisposition = qcItem.disposition;
    if (qcItem.notes) returnItem.qcNotes = qcItem.notes;
  }

  returnRequest.timeline.push({
    action: 'QC_UPDATE',
    note: `QC dispositions updated for ${items.length} item(s)`,
    performedBy: req.user._id,
    performedByName: req.user.name,
  });

  await returnRequest.save();

  res.json(returnRequest);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Generate credit note for a return
// @route   POST /api/returns/:id/credit-note
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const generateCreditNote = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  const creditNote = await generateReturnCreditNote(returnRequest, req.user);

  returnRequest.timeline.push({
    action: 'CREDIT_NOTE_GENERATED',
    note: `Credit note ${creditNote.documentNumber} generated manually`,
    performedBy: req.user._id,
    performedByName: req.user.name,
  });
  await returnRequest.save();

  res.status(201).json({ creditNote, returnRequest });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create exchange/replacement order from return
// @route   POST /api/returns/:id/exchange-order
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const createExchangeOrder = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  if (returnRequest.exchangeOrderId) {
    res.status(400);
    throw new Error(
      `Exchange order already created: ${returnRequest.exchangeOrderNumber}`
    );
  }

  if (!['EXCHANGE', 'REPLACEMENT'].includes(returnRequest.type)) {
    res.status(400);
    throw new Error('Exchange orders can only be created for EXCHANGE or REPLACEMENT returns');
  }

  const originalOrder = await Order.findById(returnRequest.order);
  if (!originalOrder) {
    res.status(404);
    throw new Error('Original order not found');
  }

  // Build new order items
  const newOrderItems = [];
  for (const item of returnRequest.items) {
    if (returnRequest.type === 'REPLACEMENT') {
      const replacementProduct = await Product.findById(item.product);
      if (!replacementProduct || !replacementProduct.isActive) {
        res.status(400);
        throw new Error(
          `Replacement product "${item.productName}" is no longer available. Cannot create replacement.`
        );
      }
      const replacementVariant = replacementProduct.size.find(
        (s) => s.size === item.size
      );
      if (!replacementVariant || replacementVariant.countInStock < item.returnQty) {
        res.status(400);
        throw new Error(
          `Replacement product "${item.productName}" (${item.size}) is out of stock. ` +
          `Available: ${replacementVariant?.countInStock || 0}`
        );
      }
      newOrderItems.push({
        name: item.productName,
        qty: item.returnQty,
        image: item.image,
        price: item.price,
        size: item.size,
        product: item.product,
        tax: item.tax,
        disc: item.disc,
        productCode: item.SKU || '',
      });
    } else if (returnRequest.type === 'EXCHANGE' && item.exchangeProduct) {
      // Exchange product
      const exchangeProduct = await Product.findById(item.exchangeProduct);
      if (!exchangeProduct || !exchangeProduct.isActive) {
        res.status(400);
        throw new Error(
          `Exchange product "${item.exchangeProductName}" is not available. Consider refund instead.`
        );
      }

      const variant = exchangeProduct.size.find(
        (s) => s.size === item.exchangeSize
      );
      if (!variant || variant.countInStock < item.returnQty) {
        res.status(400);
        throw new Error(
          `Exchange product "${item.exchangeProductName}" (${item.exchangeSize}) is out of stock. Available: ${variant?.countInStock || 0}`
        );
      }

      newOrderItems.push({
        name: exchangeProduct.name,
        qty: item.returnQty,
        image: exchangeProduct.image,
        price: item.exchangeUnitPrice || variant.price,
        size: item.exchangeSize,
        product: item.exchangeProduct,
        tax: variant.tax || 0,
        disc: variant.discount || 0,
        productCode: exchangeProduct.SKU || '',
      });
    }
  }

  if (newOrderItems.length === 0) {
    res.status(400);
    throw new Error('No items to create exchange order with');
  }

  // Calculate exchange order totals
  const totalPrice = newOrderItems.reduce((sum, item) => {
    return sum + item.price * (1 - (item.disc || 0) / 100) * item.qty;
  }, 0);

  const taxPrice = newOrderItems.reduce((sum, item) => {
    const discountedPrice = item.price * (1 - (item.disc || 0) / 100);
    const taxableAmount = discountedPrice / (1 + (item.tax || 0) / 100);
    return sum + (discountedPrice - taxableAmount) * item.qty;
  }, 0);

  // Create the exchange order
  const exchangeOrder = await Order.create({
    user: originalOrder.user,
    name: originalOrder.name,
    orderItems: newOrderItems,
    shippingAddress: originalOrder.shippingAddress,
    paymentMethod:
      returnRequest.type === 'REPLACEMENT' ? 'Replacement' : 'Exchange',
    phone: originalOrder.phone,
    taxPrice: Number(taxPrice.toFixed(2)),
    shippingPrice: 0,
    totalPrice: Number(totalPrice.toFixed(2)),
    isPaid: true,
    paidAt: new Date(),
    billType: originalOrder.billType || 'CGST',
    tracking: {
      isConfirmed: true,
      confirmedAt: new Date(),
    },
    // Return/exchange chain fields
    isExchangeOrder: true,
    originalOrderId: originalOrder._id,
    linkedReturnRequest: returnRequest._id,
  });

  // Decrement stock for each exchange/replacement item
  for (const item of newOrderItems) {
    await updateInventoryBucket({
      productId: item.product,
      size: item.size,
      increments: { quantityOnHand: -item.qty },
    }).catch((err) => {
      console.error(`[ExchangeOrder] Stock decrement failed for ${item.product} ${item.size}:`, err.message);
    });
  }

  // Update return request
  returnRequest.exchangeOrderId = exchangeOrder._id;
  returnRequest.exchangeOrderNumber = exchangeOrder.orderId;

  returnRequest.timeline.push({
    action: 'EXCHANGE_ORDER_CREATED',
    note: `${returnRequest.type} order ${exchangeOrder.orderId} created`,
    performedBy: req.user._id,
    performedByName: req.user.name,
  });

  await returnRequest.save();

  res.status(201).json({ exchangeOrder, returnRequest });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Process/record refund details
// @route   PATCH /api/returns/:id/refund
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const processRefund = asyncHandler(async (req, res) => {
  const {
    refundMethod,
    refundTransactionId,
    refundBankDetails,
    refundUpiId,
    priceDifferenceCollected,
  } = req.body;

  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  if (refundMethod) returnRequest.refundMethod = refundMethod;
  if (refundTransactionId)
    returnRequest.refundTransactionId = refundTransactionId;
  if (refundBankDetails) returnRequest.refundBankDetails = refundBankDetails;
  if (refundUpiId) returnRequest.refundUpiId = refundUpiId;
  if (priceDifferenceCollected !== undefined)
    returnRequest.priceDifferenceCollected = priceDifferenceCollected;

  // M2: record when the refund was first processed (PATCH may be called again
  // to update method/txn details — keep the original processed timestamp).
  if (!returnRequest.refundProcessedAt) {
    returnRequest.refundProcessedAt = new Date();
  }

  returnRequest.timeline.push({
    action: 'REFUND_DETAILS_UPDATED',
    note: `Refund details updated: ${refundMethod || 'method unchanged'}${refundTransactionId ? ', txn: ' + refundTransactionId : ''}${priceDifferenceCollected ? ', price difference collected' : ''}`,
    performedBy: req.user._id,
    performedByName: req.user.name,
  });

  await returnRequest.save();

  res.json(returnRequest);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add admin note to timeline
// @route   POST /api/returns/:id/notes
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const addAdminNote = asyncHandler(async (req, res) => {
  const { note } = req.body;

  if (!note || !note.trim()) {
    res.status(400);
    throw new Error('Note text is required');
  }

  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  returnRequest.timeline.push({
    action: 'ADMIN_NOTE',
    note: note.trim(),
    performedBy: req.user._id,
    performedByName: req.user.name,
  });

  await returnRequest.save();

  res.json(returnRequest);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Assign courier for reverse pickup
// @route   POST /api/returns/:id/assign-courier
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const assignReturnCourier = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  if (!returnRequest.reverseShipping?.providerShipmentId) {
    res.status(400);
    throw new Error('No Shiprocket shipment exists for this return');
  }

  if (!req.body.courierId) {
    res.status(400);
    throw new Error('courierId is required');
  }

  const data = await shippingApi('post', '/courier/assign/awb', {
    data: {
      shipment_id: returnRequest.reverseShipping.providerShipmentId,
      courier_id: req.body.courierId,
    },
    action: 'ASSIGN_AWB',
    orderId: returnRequest.order,
    asuOrderId: returnRequest.orderId,
  });

  returnRequest.reverseShipping = {
    ...returnRequest.reverseShipping?.toObject?.() || {},
    awbCode: data.awb_code || data.response?.data?.awb_code || '',
    courierName: data.courier_name || data.courier_name_code || data.response?.data?.courier_name || '',
    courierId: req.body.courierId,
  };

  returnRequest.timeline.push({
    action: 'COURIER_ASSIGNED',
    note: `AWB: ${data.response?.data?.awb_code || 'pending'}`,
    performedBy: req.user._id,
    performedByName: req.user.name,
  });

  await returnRequest.save();

  res.json(returnRequest);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Track reverse pickup status
// @route   GET /api/returns/:id/track-pickup
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const trackReturnPickup = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  if (!returnRequest.reverseShipping?.awbCode) {
    res.status(400);
    throw new Error('No AWB code assigned for this return');
  }

  const data = await shippingApi(
    'get',
    `/courier/track/awb/${returnRequest.reverseShipping.awbCode}`,
    {
      action: 'TRACK',
      orderId: returnRequest.order,
      asuOrderId: returnRequest.orderId,
    }
  );

  res.json(data);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Initiate pickup request on ShipRocket (schedule the actual pickup slot)
// @route   POST /api/returns/:id/initiate-pickup
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const initiateReturnPickup = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  if (!returnRequest.reverseShipping?.providerShipmentId) {
    res.status(400);
    throw new Error('No Shiprocket shipment exists for this return. Schedule pickup first.');
  }

  const data = await shippingApi('post', '/courier/generate/pickup', {
    data: { shipment_id: [Number(returnRequest.reverseShipping.providerShipmentId)] },
    action: 'CREATE_RETURN_ORDER',
    orderId: returnRequest.order,
    asuOrderId: returnRequest.orderId,
  });

  returnRequest.reverseShipping.pickupInitiatedAt = new Date();
  returnRequest.timeline.push({
    action: 'NOTE',
    note: `Pickup initiated on ShipRocket (response: ${data?.response?.message || 'success'})`,
    performedBy: req.user._id,
    performedByName: req.user.name,
  });
  await returnRequest.save();

  res.json({ message: 'Pickup initiated', data, returnRequest });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Generate shipping label for reverse pickup
// @route   GET /api/returns/:id/label
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const generateReturnLabel = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  if (!returnRequest.reverseShipping?.providerShipmentId) {
    res.status(400);
    throw new Error('No Shiprocket shipment exists for this return. Schedule pickup first.');
  }

  const data = await shippingApi('post', '/courier/generate/label', {
    data: { shipment_id: [Number(returnRequest.reverseShipping.providerShipmentId)] },
    action: 'GENERATE_LABEL',
    orderId: returnRequest.order,
    asuOrderId: returnRequest.orderId,
  });

  const labelUrl = data.label_url || data.response?.label_url || '';

  if (labelUrl) {
    if (!returnRequest.reverseShipping) returnRequest.reverseShipping = {};
    returnRequest.reverseShipping.labelUrl = labelUrl;
    await returnRequest.save();
  }

  res.json({ labelUrl, returnRequest });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Customer: create a return request for their own order
// @route   POST /api/returns/my
// @access  Protected (customer)
// ─────────────────────────────────────────────────────────────────────────────
export const createMyReturnRequest = asyncHandler(async (req, res) => {
  const { order: orderId, items, reason, reasonDetails, evidenceImages } = req.body;

  if (!orderId || !reason || !items || items.length === 0) {
    res.status(400);
    throw new Error('order, reason, and items are required');
  }

  const lockKey = `return:lock:${orderId}`;
  const lockAcquired = await acquireLock(lockKey, 30);
  if (!lockAcquired) {
    res.status(409);
    throw new Error('Another return is being created for this order. Please try again.');
  }

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Ensure order belongs to the requesting customer
    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorised to return this order');
    }

    validateOrderEligibility(order);
    validateReturnWindow(order, false);

    // M3: resolve against modifiedItems when the order was modified post-purchase.
    const sourceItems = resolveOrderItems(order);

    // Resolve order items by _id first so checkOverReturn gets product+size
    const returnItems = items.map((reqItem) => {
      const orderItem = sourceItems.find(
        (oi) => oi._id.toString() === reqItem.orderItemId
      );
      if (!orderItem) throw new Error(`Order item ${reqItem.orderItemId} not found in order`);

      return {
        product: orderItem.product,
        productName: orderItem.name,
        SKU: orderItem.productCode || '',
        size: orderItem.size,
        image: orderItem.image,
        originalQty: orderItem.qty,
        returnQty: reqItem.returnQty,
        price: orderItem.price,
        disc: orderItem.disc || 0,
        tax: orderItem.tax || 0,
        refundAmount: computeItemRefund(orderItem, reqItem.returnQty),
      };
    });

    // Backfill SKU from the product's canonical SKU when productCode is blank.
    for (const ri of returnItems) {
      if (!ri.SKU) {
        const prod = await Product.findById(ri.product).select('SKU');
        if (prod?.SKU) ri.SKU = prod.SKU;
      }
    }

    // checkOverReturn expects items with { product, size, returnQty }
    await checkOverReturn(orderId, returnItems, sourceItems);

    const user = await User.findById(order.user);

    const totalRefundAmount = returnItems.reduce((sum, item) => sum + item.refundAmount, 0);

    const resolvedPickupAddress = {
      address: order.shippingAddress?.address,
      city: order.shippingAddress?.city,
      state: order.shippingAddress?.state,
      postalCode: order.shippingAddress?.postalCode,
      country: order.shippingAddress?.country || 'India',
      phone: order.phone || '',
    };

    const returnRequest = await ReturnRequest.create({
      type: 'RETURN',
      status: 'INITIATED',
      order: order._id,
      orderId: order.orderId,
      invoiceNumber: order.invoiceNumber || '',
      customer: order.user,
      customerName: user?.name || order.name,
      customerEmail: user?.email || '',
      customerPhone: order.phone || user?.phone || '',
      items: returnItems,
      reason,
      reasonDetails: reasonDetails || '',
      evidenceImages: evidenceImages || [],
      pickupAddress: resolvedPickupAddress,
      refundAmount: Number(totalRefundAmount.toFixed(2)),
      // Shipping is never refunded on returns.
      shippingRefundAmount: 0,
      billType: order.billType || 'CGST',
      timeline: [{
        action: 'CREATED',
        toStatus: 'INITIATED',
        note: `Return request created by customer. Reason: ${reason}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
      }],
      createdBy: req.user._id,
      createdByName: req.user.name,
    });

    order.hasReturns = true;
    await order.save();

    sendReturnEmail(returnRequest, 'INITIATED').catch((err) => {
      console.error('Return initiated email failed (non-blocking):', err.message);
    });

    res.status(201).json(returnRequest);
  } catch (err) {
    console.error('[createMyReturnRequest] error:', err?.message, err?.stack?.split('\n')[1]);
    throw err;
  } finally {
    await releaseLock(lockKey);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Customer: get returns for their own order
// @route   GET /api/returns/my/order/:orderId
// @access  Protected (customer)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyReturnsByOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).select('user');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }

  const returns = await ReturnRequest.find({ order: req.params.orderId }).sort({ createdAt: -1 });
  res.json(returns);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Customer: get a single return by its MongoDB _id (must own it)
// @route   GET /api/returns/my/:id
// @access  Protected (customer)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyReturnById = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }
  if (returnRequest.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }
  res.json(returnRequest);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Customer: cancel their own return (only while cancellable)
// @route   PATCH /api/returns/my/:id/cancel
// @access  Protected (customer)
// ─────────────────────────────────────────────────────────────────────────────
export const cancelMyReturnRequest = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }
  if (returnRequest.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }

  // State machine decides if CANCELLED is legal from the current status.
  validateTransition(returnRequest.status, 'CANCELLED', returnRequest.type);

  const previousStatus = returnRequest.status;
  returnRequest.status = 'CANCELLED';
  returnRequest.timeline.push({
    action: 'STATUS_CHANGE',
    fromStatus: previousStatus,
    toStatus: 'CANCELLED',
    note: 'Cancelled by customer',
    performedBy: req.user._id,
    performedByName: req.user.name,
  });
  await returnRequest.save();

  // H3: free the order to be returned again.
  await recomputeOrderReturnFlag(returnRequest.order);

  sendReturnEmail(returnRequest, 'CANCELLED').catch((err) => {
    console.error('Return CANCELLED email failed (non-blocking):', err.message);
  });

  res.json(returnRequest);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Customer: eligibility summary for returning one of their orders
// @route   GET /api/returns/my/order/:orderId/eligibility
// @access  Protected (customer)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyReturnEligibility = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).select(
    'user tracking hasReturns'
  );
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }
  res.json(getReturnEligibility(order));
});
